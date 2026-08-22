import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { AuthzError } from "@/lib/authz/errors";
import { grantCredits, getWalletBalance } from "@/lib/credits/ledger";
import { createDb } from "@/lib/db/client";
import {
  auditLogs,
  creativeVersions,
  generationAttempts,
  productionJobs,
  profiles,
  projects,
  user,
} from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { adminCancelJob, adminMarkTechnicalFailure, adminRefundJob } from "./jobs";
import { adminGrantCredits } from "./credits";
import { getAdminOverview, listAdminUsers } from "./queries";
import { saveAiSettings } from "./settings";

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

test("admin user list never selects passwords", () => {
  const source = listAdminUsers.toString();
  assert.equal(/password/i.test(source), false);
});

test("non-admin cannot refund or grant; admin can refund once and cancel", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase22.o.${stamp}@cineyou.test`, "Owner TwentyTwo");
  const staff = await insertPerson(db, `phase22.s.${stamp}@cineyou.test`, "Staff TwentyTwo");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase TwentyTwo ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Harbour ${stamp}` },
  });
  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 2,
    type: "PROMOTION",
    idempotencyKey: `phase22-grant-${stamp}`,
  });

  const projectId = newId();
  const creativeId = newId();
  const jobId = newId();
  const attemptId = newId();
  const now = new Date();
  await db.insert(projects).values({
    id: projectId,
    workspaceId: studio.workspaceId,
    businessId: studio.businessId,
    createdByUserId: owner,
    title: "Staff job",
    duration: 30,
    status: "FAILED",
    currentCreativeVersionId: creativeId,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(creativeVersions).values({
    id: creativeId,
    projectId,
    version: 1,
    seedancePrompt: "prompt",
    createdAt: now,
  });
  await db.insert(productionJobs).values({
    id: jobId,
    workspaceId: studio.workspaceId,
    projectId,
    creativeVersionId: creativeId,
    status: "FAILED",
    attemptNumber: 1,
    createdAt: now,
    updatedAt: now,
  });
  const { generationIdempotencyKey, reserveGenerationCredit } = await import("@/lib/credits/ledger");
  const credit = await reserveGenerationCredit(db, {
    workspaceId: studio.workspaceId,
    projectId,
    attemptId,
  });
  await db.insert(generationAttempts).values({
    id: attemptId,
    projectId,
    jobId,
    attemptNumber: 1,
    provider: "seedance",
    creativeVersionId: creativeId,
    creditTransactionId: credit.id,
    reason: "produce",
    result: "failed",
    createdAt: now,
  });
  await db
    .update(productionJobs)
    .set({ creditTransactionId: credit.id })
    .where(eq(productionJobs.id, jobId));

  const outsider = {
    userId: owner,
    email: `phase22.o.${stamp}@cineyou.test`,
    adminEmails: [`phase22.s.${stamp}@cineyou.test`],
  };
  const admin = {
    userId: staff,
    email: `phase22.s.${stamp}@cineyou.test`,
    adminEmails: [`phase22.s.${stamp}@cineyou.test`],
  };

  await assert.rejects(
    () => adminRefundJob(db, outsider, jobId),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );
  await assert.rejects(
    () => adminGrantCredits(db, outsider, { workspaceId: studio.workspaceId, amount: 1, reason: "nope" }),
    (error: unknown) => error instanceof AuthzError && error.code === "FORBIDDEN",
  );

  const before = await getWalletBalance(db, studio.workspaceId);
  const refund = await adminRefundJob(db, admin, jobId);
  const refundAgain = await adminRefundJob(db, admin, jobId);
  assert.equal(refundAgain.id, refund.id);
  assert.equal(await getWalletBalance(db, studio.workspaceId), before + 1);

  await adminCancelJob(db, admin, jobId);
  const [cancelled] = await db.select().from(productionJobs).where(eq(productionJobs.id, jobId)).limit(1);
  assert.equal(cancelled?.status, "CANCELLED");

  const overview = await getAdminOverview(db);
  assert.equal(typeof overview.users, "number");
  assert.ok(overview.users >= 1);
  assert.equal(overview.revenueZarMinor >= 0, true);

  await assert.rejects(
    () =>
      saveAiSettings(db, admin, {
        fal_api_key: "sk-live-should-never-store",
      } as never),
    /secrets cannot be stored/i,
  );

  const [log] = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, "admin.credit_refunded"))
    .limit(1);
  assert.ok(log);

  const failedJob = newId();
  const failedAttempt = newId();
  await db.insert(productionJobs).values({
    id: failedJob,
    workspaceId: studio.workspaceId,
    projectId,
    creativeVersionId: creativeId,
    status: "FAILED",
    attemptNumber: 2,
    createdAt: now,
    updatedAt: now,
  });
  const credit2 = await reserveGenerationCredit(db, {
    workspaceId: studio.workspaceId,
    projectId,
    attemptId: failedAttempt,
  });
  await db.insert(generationAttempts).values({
    id: failedAttempt,
    projectId,
    jobId: failedJob,
    attemptNumber: 2,
    provider: "seedance",
    creativeVersionId: creativeId,
    creditTransactionId: credit2.id,
    createdAt: now,
  });
  await adminMarkTechnicalFailure(db, admin, failedJob);
  const [marked] = await db.select().from(productionJobs).where(eq(productionJobs.id, failedJob)).limit(1);
  assert.equal(marked?.failureType, "technical");
  void generationIdempotencyKey;
});
