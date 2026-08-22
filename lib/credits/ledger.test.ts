import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "@/lib/db/client";
import { creditTransactions, profiles, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { eq } from "drizzle-orm";
import { NO_PRODUCTION_CREDITS, produceHoldReason } from "./copy";
import { CreditError } from "./errors";
import {
  generationIdempotencyKey,
  getWalletBalance,
  grantCredits,
  refundTechnicalFailure,
  reserveGenerationCredit,
} from "./ledger";

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

test("zero credits blocks production and one generation consumes one credit", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `phase13.${stamp}@cineyou.test`, "Owner Thirteen");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Thirteen ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Credits Brand ${stamp}` },
  });
  const projectId = newId();
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);
  await assert.rejects(
    () =>
      reserveGenerationCredit(db, {
        workspaceId: studio.workspaceId,
        projectId,
        attemptId: "first",
      }),
    (error: unknown) => error instanceof CreditError && error.code === "NO_CREDITS",
  );
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 1,
    type: "PROMOTION",
    idempotencyKey: `grant-${studio.workspaceId}-1`,
    description: "Test credit",
  });
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  const spent = await reserveGenerationCredit(db, {
    workspaceId: studio.workspaceId,
    projectId,
    attemptId: "first",
  });
  assert.equal(spent.amount, -1);
  assert.equal(spent.type, "GENERATION");
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const again = await reserveGenerationCredit(db, {
    workspaceId: studio.workspaceId,
    projectId,
    attemptId: "first",
  });
  assert.equal(again.id, spent.id);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const duplicateKey = generationIdempotencyKey(projectId, "first");
  const [countRow] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.idempotencyKey, duplicateKey));
  assert.equal(countRow?.id, spent.id);
});

test("technical refund returns once and a variation uses another credit", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 1;
  const owner = await insertPerson(db, `phase13b.${stamp}@cineyou.test`, "Owner Thirteen B");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Thirteen B ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Credits Brand B ${stamp}` },
  });
  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 2,
    type: "PROMOTION",
    idempotencyKey: `grant-${studio.workspaceId}-2`,
  });
  const projectId = newId();
  const first = await reserveGenerationCredit(db, {
    workspaceId: studio.workspaceId,
    projectId,
    attemptId: "job-1",
  });
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  const generationKey = generationIdempotencyKey(projectId, "job-1");
  const refund = await refundTechnicalFailure(db, {
    workspaceId: studio.workspaceId,
    generationIdempotencyKey: generationKey,
  });
  assert.equal(refund.type, "TECHNICAL_REFUND");
  assert.equal(refund.amount, 1);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 2);

  const refundAgain = await refundTechnicalFailure(db, {
    workspaceId: studio.workspaceId,
    generationIdempotencyKey: generationKey,
  });
  assert.equal(refundAgain.id, refund.id);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 2);

  const variation = await reserveGenerationCredit(db, {
    workspaceId: studio.workspaceId,
    projectId,
    attemptId: "job-2",
  });
  assert.notEqual(variation.id, first.id);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 2,
    type: "PROMOTION",
    idempotencyKey: `grant-${studio.workspaceId}-2`,
  });
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);
});

test("produce hold explains zero credits without spending", () => {
  assert.equal(produceHoldReason(0, "Filming opens later."), NO_PRODUCTION_CREDITS);
  assert.equal(produceHoldReason(2, "Filming opens later."), "Filming opens later.");
});
