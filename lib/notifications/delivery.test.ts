import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { createDb } from "@/lib/db/client";
import { notifications, profiles, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { READY_EMAIL_BUTTON, READY_EMAIL_SUBJECT } from "./copy";
import { insertNotification } from "./in-app";
import { notifyProductionComplete, notifyProductionFailed } from "./notify";
import { handleQueueBatch, shouldUseNotificationQueue } from "./queue";
import { renderEmail } from "./templates";
import type { EmailQueueMessage } from "./messages";

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

test("support emails tell staff and the customer what happened", () => {
  const staff = renderEmail({
    kind: "email",
    template: "support-staff",
    to: "schalk@thewellmedia.com",
    idempotencyKey: "support-staff/ticket/staff",
    appUrl: "https://cineyou.test",
    actionUrl: "/admin/support/ticket-1",
    body: "Pat sent a Refund message. Subject: I want my money back.",
  });
  assert.equal(staff.subject, "New Production30 support message");
  assert.match(staff.html, /Open Admin Support/);
  const received = renderEmail({
    kind: "email",
    template: "support-received",
    to: "pat@cineyou.test",
    idempotencyKey: "support-received/ticket",
    appUrl: "https://cineyou.test",
    actionUrl: "/dashboard/help",
    body: "Thanks. We received your message. We'll email you back.",
  });
  assert.equal(received.subject, "We received your Production30 message");
  const reply = renderEmail({
    kind: "email",
    template: "support-reply",
    to: "pat@cineyou.test",
    idempotencyKey: "support-reply/reply/pat",
    appUrl: "https://cineyou.test",
    actionUrl: "/dashboard/help",
    body: "We added your Ad Credit back.",
  });
  assert.equal(reply.subject, "A reply from Production30");
  assert.match(reply.html, /We added your Ad Credit back/);
});

test("ready email uses the spec subject and button, with no video attached", () => {
  const rendered = renderEmail({
    kind: "email",
    template: "commercial-ready",
    to: "owner@cineyou.test",
    idempotencyKey: "production-ready/job/user",
    appUrl: "https://cineyou.test",
    actionUrl: "/dashboard/commercials/abc",
  });
  assert.equal(rendered.subject, READY_EMAIL_SUBJECT);
  assert.match(rendered.html, new RegExp(READY_EMAIL_BUTTON));
  assert.match(rendered.html, /https:\/\/cineyou\.test\/dashboard\/commercials\/abc/);
  assert.equal(/video|mp4|attachment/i.test(rendered.html), false);
});

test("queues stay off outside production so next dev still delivers", () => {
  assert.equal(
    shouldUseNotificationQueue({ NOTIFICATION_QUEUE: {} as Queue, NEXTJS_ENV: "development" }),
    false,
  );
  assert.equal(
    shouldUseNotificationQueue({ NOTIFICATION_QUEUE: {} as Queue, NEXTJS_ENV: "production" }),
    true,
  );
});

test("completion and failure notices are idempotent; email failure does not throw", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase20.${stamp}@cineyou.test`, "Owner Twenty");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Twenty ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Harbour Tours ${stamp}` },
  });
  const jobId = newId();
  const projectId = newId();
  const emails: EmailQueueMessage[] = [];

  await notifyProductionComplete(
    db,
    { workspaceId: studio.workspaceId, projectId, jobId, producerUserId: owner },
    {
      appUrl: "http://localhost:3000",
      enqueueEmail: async (message) => {
        emails.push(message);
      },
    },
  );
  await notifyProductionComplete(
    db,
    { workspaceId: studio.workspaceId, projectId, jobId, producerUserId: owner },
    {
      appUrl: "http://localhost:3000",
      enqueueEmail: async (message) => {
        emails.push(message);
      },
    },
  );
  const readyRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.workspaceId, studio.workspaceId));
  assert.equal(readyRows.filter((row) => row.type === "production_ready").length, 1);
  assert.equal(emails.filter((item) => item.template === "commercial-ready").length, 1);

  await notifyProductionFailed(
    db,
    {
      workspaceId: studio.workspaceId,
      projectId,
      jobId: newId(),
      producerUserId: owner,
      refunded: true,
    },
    {
      appUrl: "http://localhost:3000",
      enqueueEmail: async () => {
        throw new Error("QUEUE_FAILED");
      },
    },
  );
  const afterFail = await db
    .select()
    .from(notifications)
    .where(eq(notifications.workspaceId, studio.workspaceId));
  assert.ok(afterFail.some((row) => row.type === "production_failed"));
  assert.ok(afterFail.some((row) => row.type === "credit_refunded"));

  const duplicate = await insertNotification(db, {
    userId: owner,
    workspaceId: studio.workspaceId,
    type: "production_ready",
    title: "Your commercial is ready",
    body: "Ready",
    actionUrl: `/dashboard/commercials/${projectId}`,
    eventKey: readyRows[0]?.eventKey ?? "production-ready/missing",
  });
  assert.equal(duplicate, "duplicate");
});

test("queue consumer retries email failures and acks success", async () => {
  const acked: string[] = [];
  const retried: string[] = [];
  let sends = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    sends += 1;
    if (sends === 1) {
      return new Response("nope", { status: 500 });
    }
    return new Response(JSON.stringify({ id: "ok" }), { status: 200 });
  }) as typeof fetch;
  try {
    await handleQueueBatch(
      {
        queue: "cineyou-notifications",
        messages: [
          {
            body: {
              kind: "email",
              template: "commercial-ready",
              to: "owner@cineyou.test",
              idempotencyKey: "production-ready/job/user",
              appUrl: "http://localhost:3000",
              actionUrl: "/dashboard/commercials/x",
            },
            ack: () => acked.push("fail"),
            retry: () => retried.push("fail"),
          },
        ],
      },
      { RESEND_API_KEY: "re_test", EMAIL_FROM: "Production30 <studio@production30.test>" },
    );
    await handleQueueBatch(
      {
        queue: "cineyou-notifications",
        messages: [
          {
            body: {
              kind: "email",
              template: "commercial-ready",
              to: "owner@cineyou.test",
              idempotencyKey: "production-ready/job/user",
              appUrl: "http://localhost:3000",
              actionUrl: "/dashboard/commercials/x",
            },
            ack: () => acked.push("ok"),
            retry: () => retried.push("ok"),
          },
        ],
      },
      { RESEND_API_KEY: "re_test", EMAIL_FROM: "Production30 <studio@production30.test>" },
    );
  } finally {
    globalThis.fetch = original;
  }
  assert.deepEqual(retried, ["fail"]);
  assert.deepEqual(acked, ["ok"]);
});
