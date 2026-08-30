import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { createDb } from "@/lib/db/client";
import {
  assets,
  creativeVersions,
  payments,
  productionJobs,
  profiles,
  projects,
  session,
  supportTickets,
  user,
  workspaceMembers,
} from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { identityObjectKey } from "@/lib/r2/keys";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { RATE_LIMIT_MESSAGE } from "./copy";
import { deleteAccount } from "./delete";
import { exportAccountData } from "./export";
import { RATE_LIMITS, assertRateLimit } from "./rate-limit";
import { isForbiddenPublicEnvName, publicEnvLines } from "./secrets";
import { createSupportTicket } from "./support";
import { RateLimitError } from "./errors";
import { assertAllowedUploadBytes, looksLikePng } from "@/lib/r2/sniff";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

test("PNG magic bytes are required; random bytes are rejected", () => {
  assert.equal(looksLikePng(PNG), true);
  assert.doesNotThrow(() => assertAllowedUploadBytes(PNG, "image/png"));
  assert.throws(() => assertAllowedUploadBytes(new Uint8Array([1, 2, 3, 4]), "image/png"));
  assert.throws(() =>
    assertAllowedUploadBytes(
      new TextEncoder().encode("<svg xmlns='http://www.w3.org/2000/svg'></svg>"),
      "image/svg+xml",
    ),
  );
});

test("NEXT_PUBLIC_ env in .env.example is not a secret", () => {
  const example = readFileSync(new URL("../../.env.example", import.meta.url), "utf8");
  for (const name of publicEnvLines(example)) {
    assert.equal(isForbiddenPublicEnvName(name), false, name);
  }
  assert.equal(isForbiddenPublicEnvName("NEXT_PUBLIC_FAL_KEY"), true);
  assert.equal(isForbiddenPublicEnvName("NEXT_PUBLIC_REAPI_API_KEY"), true);
  assert.equal(isForbiddenPublicEnvName("NEXT_PUBLIC_PAYSTACK_SECRET_KEY"), true);
  assert.equal(isForbiddenPublicEnvName("NEXT_PUBLIC_PAYFAST_MERCHANT_KEY"), true);
  assert.equal(isForbiddenPublicEnvName("NEXT_PUBLIC_PAYFAST_PASSPHRASE"), true);
  assert.equal(isForbiddenPublicEnvName("NEXT_PUBLIC_PAYONEER_TOKEN"), true);
  assert.equal(isForbiddenPublicEnvName("NEXT_PUBLIC_RAPYD_SECRET_KEY"), true);
  assert.equal(isForbiddenPublicEnvName("NEXT_PUBLIC_RAPYD_ACCESS_KEY"), true);
});

test("rate limit, account deletion retains payments, and abuse tickets", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase23.o.${stamp}@cineyou.test`, "Owner TwentyThree");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase TwentyThree ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Harbour ${stamp}` },
  });

  const subject = `prod-${stamp}`;
  for (let i = 0; i < RATE_LIMITS.production.max; i += 1) {
    await assertRateLimit(db, "production", subject);
  }
  await assert.rejects(() => assertRateLimit(db, "production", subject), (error: unknown) => {
    assert.equal(error instanceof RateLimitError, true);
    assert.equal((error as Error).message, RATE_LIMIT_MESSAGE);
    return true;
  });

  const now = new Date();
  const assetId = newId();
  const objectKey = identityObjectKey(studio.workspaceId, owner, "IDENTITY_FRONT", newId());
  await db.insert(assets).values({
    id: assetId,
    workspaceId: studio.workspaceId,
    ownerUserId: owner,
    category: "identity",
    role: "IDENTITY_FRONT",
    r2ObjectKey: objectKey,
    mimeType: "image/png",
    sizeBytes: 12,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(payments).values({
    id: newId(),
    workspaceId: studio.workspaceId,
    provider: "paystack",
    providerReference: `phase23-${stamp}`,
    currency: "ZAR",
    amountMinor: 49900,
    status: "success",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(session).values({
    id: newId(),
    token: `phase23-session-${stamp}`,
    userId: owner,
    expiresAt: new Date(now.getTime() + 86_400_000),
    createdAt: now,
    updatedAt: now,
  });

  const cleaned: string[] = [];
  await deleteAccount(
    db,
    { userId: owner, confirmation: "DELETE" },
    {
      hasPassword: false,
      cancelOwnedSubscription: async () => undefined,
      enqueueCleanup: async (_workspaceId, key) => {
        cleaned.push(key);
      },
      revokeSessions: async () => undefined,
    },
  );

  const [closed] = await db.select().from(user).where(eq(user.id, owner)).limit(1);
  assert.equal(closed?.email.startsWith("deleted."), true);
  const [profile] = await db.select().from(profiles).where(eq(profiles.userId, owner)).limit(1);
  assert.ok(profile?.deletedAt);
  const sessions = await db.select().from(session).where(eq(session.userId, owner));
  assert.equal(sessions.length, 0);
  const members = await db.select().from(workspaceMembers).where(eq(workspaceMembers.userId, owner));
  assert.equal(members.length, 0);
  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  assert.ok(asset?.deletedAt);
  assert.ok(cleaned.includes(objectKey));
  const receipts = await db.select().from(payments).where(eq(payments.workspaceId, studio.workspaceId));
  assert.equal(receipts.length, 1);
  assert.equal(receipts[0]?.amountMinor, 49900);

  const teammate = await insertPerson(db, `phase23.t.${stamp}@cineyou.test`, "Teammate TwentyThree");
  const crowded = await createWorkspaceForOwner(db, {
    ownerUserId: teammate,
    name: `Phase TwentyThree Team ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Team Brand ${stamp}` },
  });
  await db.insert(workspaceMembers).values({
    id: newId(),
    workspaceId: crowded.workspaceId,
    userId: owner,
    role: "ADMIN",
    status: "active",
    joinedAt: now,
    createdAt: now,
  });
  await assert.rejects(
    () =>
      deleteAccount(
        db,
        { userId: teammate, confirmation: "DELETE" },
        {
          hasPassword: false,
          cancelOwnedSubscription: async () => undefined,
          enqueueCleanup: async () => undefined,
          revokeSessions: async () => undefined,
        },
      ),
    /other people on the team/i,
  );

  const flyingOwner = await insertPerson(db, `phase23.f.${stamp}@cineyou.test`, "Flying TwentyThree");
  const flyingStudio = await createWorkspaceForOwner(db, {
    ownerUserId: flyingOwner,
    name: `Phase TwentyThree Fly ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Fly Brand ${stamp}` },
  });
  const flyingProject = newId();
  const flyingCreative = newId();
  await db.insert(projects).values({
    id: flyingProject,
    workspaceId: flyingStudio.workspaceId,
    businessId: flyingStudio.businessId,
    createdByUserId: flyingOwner,
    title: "In flight",
    duration: 30,
    status: "IN_PRODUCTION",
    currentCreativeVersionId: flyingCreative,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(creativeVersions).values({
    id: flyingCreative,
    projectId: flyingProject,
    version: 1,
    seedancePrompt: "prompt",
    createdAt: now,
  });
  await db.insert(productionJobs).values({
    id: newId(),
    workspaceId: flyingStudio.workspaceId,
    projectId: flyingProject,
    creativeVersionId: flyingCreative,
    status: "SEEDANCE_PROCESSING",
    attemptNumber: 1,
    createdAt: now,
    updatedAt: now,
  });
  await assert.rejects(
    () =>
      deleteAccount(
        db,
        { userId: flyingOwner, confirmation: "DELETE" },
        {
          hasPassword: false,
          cancelOwnedSubscription: async () => undefined,
          enqueueCleanup: async () => undefined,
          revokeSessions: async () => undefined,
        },
      ),
    /still being produced/i,
  );

  const ticket = await createSupportTicket(db, {
    userId: flyingOwner,
    workspaceId: flyingStudio.workspaceId,
    category: "Abuse",
    subject: "Someone used my face",
    message: "Please look into an impersonation report for this studio.",
  });
  const [saved] = await db.select().from(supportTickets).where(eq(supportTickets.id, ticket.id)).limit(1);
  assert.equal(saved?.category, "Abuse");

  const exported = await exportAccountData(db, flyingOwner);
  assert.equal(exported.profile.email, `phase23.f.${stamp}@cineyou.test`);
  assert.ok(exported.studios.length >= 1);
});
