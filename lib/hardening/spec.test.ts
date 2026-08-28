import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { createAuth } from "@/lib/auth/create-auth";
import { cancelWorkspaceSubscription } from "@/lib/billing/cancel";
import { insertTestPlan } from "@/lib/billing/plans";
import { createDb } from "@/lib/db/client";
import { payments, profiles, session, subscriptions, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { isCleanupQueueMessage } from "@/lib/notifications/messages";
import { handleQueueBatch } from "@/lib/notifications/queue";
import { createMockPaymentProvider } from "@/lib/providers/payments";
import type { EmailMessage } from "@/lib/providers/email";
import { ACCOUNT_CLOSED_LOGIN } from "@/lib/security/copy";
import { closedAccountEmail, deleteAccount } from "@/lib/security/delete";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";

const AUTH_ENV = {
  BETTER_AUTH_SECRET: "cineyou-phase24-test-secret-32chars!",
  BETTER_AUTH_URL: "http://localhost:3000",
};

function extractUrl(text: string) {
  const match = text.match(/https?:\/\/\S+/);
  assert.ok(match, "expected a URL in the email body");
  return match[0];
}

async function insertPerson(db: ReturnType<typeof createDb>, email: string, name: string) {
  const id = newId();
  const now = new Date();
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    firstName: name.split(" ")[0],
    lastName: name.split(" ").slice(1).join(" ") || name,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(profiles).values({
    userId: id,
    firstName: name.split(" ")[0] ?? "Test",
    lastName: name.split(" ").slice(1).join(" ") || "User",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

test("cleanup messages are typed; foreign keys are acked; matching keys are deleted", async (t) => {
  assert.equal(
    isCleanupQueueMessage({ kind: "cleanup", workspaceId: newId(), objectKey: "workspaces/x/y" }),
    true,
  );
  assert.equal(isCleanupQueueMessage({ kind: "email", to: "a@b.c" }), false);

  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const bucket = proxy.env.MEDIA_BUCKET as R2Bucket;
  const workspaceId = newId();
  const objectKey = `workspaces/${workspaceId}/cleanup/${newId()}`;
  await bucket.put(objectKey, new Uint8Array([1, 2, 3, 4]), {
    httpMetadata: { contentType: "application/octet-stream" },
  });
  assert.ok(await bucket.head(objectKey));

  const acked: string[] = [];
  const retried: string[] = [];
  await handleQueueBatch(
    {
      queue: "cineyou-cleanup",
      messages: [
        {
          body: {
            kind: "cleanup",
            workspaceId: newId(),
            objectKey: "workspaces/other/not-this-studio.mp4",
          },
          ack: () => acked.push("bad-key"),
          retry: () => retried.push("bad-key"),
        },
        {
          body: { kind: "cleanup", workspaceId, objectKey },
          ack: () => acked.push("ok-key"),
          retry: () => retried.push("ok-key"),
        },
      ],
    },
    { MEDIA_BUCKET: bucket },
  );
  assert.deepEqual(acked, ["bad-key", "ok-key"]);
  assert.deepEqual(retried, []);
  assert.ok(!(await bucket.head(objectKey)));
});

test("a closed profile cannot sign in with the original email", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const email = `phase24.closed.${Date.now()}@cineyou.test`;
  const owner = await insertPerson(db, email, "Closed Owner");
  await db
    .update(profiles)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(eq(profiles.userId, owner));

  const auth = createAuth(db, AUTH_ENV);
  const signIn = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: "StudioPass1" }),
    }),
  );
  assert.equal(signIn.ok, false);
  assert.equal(signIn.status, 403);
  assert.match(await signIn.text(), new RegExp(ACCOUNT_CLOSED_LOGIN));
});

test("account deletion cancels the subscription, keeps payments, and blocks the old email", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const email = `phase24.del.${stamp}@cineyou.test`;
  const password = "StudioPass1";
  const sent: EmailMessage[] = [];
  const auth = createAuth(db, AUTH_ENV, {
    email: {
      async send(message) {
        sent.push(message);
      },
    },
  });

  const signUp = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name: "Owner Delete",
        firstName: "Owner",
        lastName: "Delete",
      }),
    }),
  );
  assert.equal(signUp.ok, true, await signUp.clone().text());
  const verifyMail = sent.find((message) => message.subject.includes("Confirm"));
  assert.ok(verifyMail);
  const verify = await auth.handler(new Request(extractUrl(verifyMail.text)));
  assert.ok(verify.status === 200 || verify.status === 302, await verify.clone().text());

  const [person] = await db.select().from(user).where(eq(user.email, email)).limit(1);
  assert.ok(person);
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: person.id,
    name: `Phase TwentyFour Delete ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Delete Brand ${stamp}` },
  });
  const plan = await insertTestPlan(db, {
    id: newId(),
    code: `phase24_${stamp}`,
    name: "Test monthly",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 9900,
    credits: 2,
    interval: "month",
    metadataJson: null,
  });
  const now = new Date();
  await db.insert(subscriptions).values({
    id: newId(),
    workspaceId: studio.workspaceId,
    planId: plan.id,
    provider: "mock",
    providerCustomerId: "cus_mock|mock_email_token",
    providerSubscriptionId: `sub_mock_${stamp}`,
    status: "active",
    periodStart: now,
    periodEnd: new Date(now.getTime() + 30 * 86_400_000),
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(payments).values({
    id: newId(),
    workspaceId: studio.workspaceId,
    provider: "mock",
    providerReference: `phase24-del-${stamp}`,
    currency: "ZAR",
    amountMinor: 9900,
    status: "success",
    createdAt: now,
    updatedAt: now,
  });

  let cancelled = 0;
  await deleteAccount(
    db,
    { userId: person.id, confirmation: "DELETE", password },
    {
      hasPassword: true,
      verifyPassword: async (value) => value === password,
      cancelOwnedSubscription: async (workspaceId) => {
        cancelled += 1;
        await cancelWorkspaceSubscription(db, {
          workspaceId,
          provider: createMockPaymentProvider(),
          adapter: "mock",
        });
      },
      enqueueCleanup: async () => undefined,
      revokeSessions: async () => undefined,
    },
  );

  assert.equal(cancelled, 1);
  const [closed] = await db.select().from(user).where(eq(user.id, person.id)).limit(1);
  assert.equal(closed?.email, closedAccountEmail(person.id));
  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, studio.workspaceId))
    .limit(1);
  assert.equal(sub?.cancelAtPeriodEnd, true);
  assert.equal(sub?.status, "active");
  const receipts = await db.select().from(payments).where(eq(payments.workspaceId, studio.workspaceId));
  assert.equal(receipts.length, 1);
  const sessions = await db.select().from(session).where(eq(session.userId, person.id));
  assert.equal(sessions.length, 0);

  const signIn = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
  assert.equal(signIn.ok, false);
});
