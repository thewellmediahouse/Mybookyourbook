import { test } from "node:test";
import assert from "node:assert/strict";
import { eq } from "drizzle-orm";
import { AuthzError } from "@/lib/authz/errors";
import { getWalletBalance, grantCredits } from "@/lib/credits/ledger";
import { createDb } from "@/lib/db/client";
import { auditLogs, payments, plans, profiles, subscriptions, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { adminMarkCancelAtPeriodEnd, adminRecordMoneyRefund } from "./billing-ops";

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

test("staff can record a money return without granting credits, and mark cancel at period end", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const owner = await insertPerson(db, `ops.bill.${stamp}@cineyou.test`, "Owner Billing");
  const staff = await insertPerson(db, `ops.bill.staff.${stamp}@cineyou.test`, "Staff Billing");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Ops Billing ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Ops Pay ${stamp}` },
  });
  await grantCredits(db, {
    workspaceId: studio.workspaceId,
    amount: 3,
    type: "PROMOTION",
    idempotencyKey: `ops-bill-grant-${stamp}`,
  });
  const before = await getWalletBalance(db, studio.workspaceId);
  const now = new Date();
  const paymentId = newId();
  await db.insert(payments).values({
    id: paymentId,
    workspaceId: studio.workspaceId,
    provider: "payoneer",
    providerReference: `ops-pay-${stamp}`,
    currency: "ZAR",
    amountMinor: 9900,
    status: "success",
    createdAt: now,
    updatedAt: now,
  });
  const staffActor = {
    userId: staff,
    email: `ops.bill.staff.${stamp}@cineyou.test`,
    adminEmails: [`ops.bill.staff.${stamp}@cineyou.test`],
  };
  await assert.rejects(
    () =>
      adminRecordMoneyRefund(
        db,
        { userId: owner, email: `ops.bill.${stamp}@cineyou.test`, adminEmails: staffActor.adminEmails },
        { paymentId, note: "Returned in Payoneer Checkout" },
      ),
    AuthzError,
  );
  await adminRecordMoneyRefund(db, staffActor, {
    paymentId,
    note: "Returned in Payoneer Checkout",
  });
  const [payment] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
  assert.equal(payment?.status, "refunded");
  assert.equal(await getWalletBalance(db, studio.workspaceId), before);
  const audits = await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.action, "admin.payment_money_refunded"));
  assert.ok(audits.some((row) => row.targetId === paymentId));

  const planId = newId();
  await db.insert(plans).values({
    id: planId,
    code: `ops-month-${stamp}`,
    name: "Ops monthly",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 19900,
    credits: 4,
    interval: "month",
    active: true,
  });
  const subscriptionId = newId();
  await db.insert(subscriptions).values({
    id: subscriptionId,
    workspaceId: studio.workspaceId,
    planId,
    provider: "payoneer",
    status: "active",
    cancelAtPeriodEnd: false,
    periodStart: now,
    periodEnd: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    createdAt: now,
    updatedAt: now,
  });
  await adminMarkCancelAtPeriodEnd(db, staffActor, { subscriptionId });
  const [subscription] = await db.select().from(subscriptions).where(eq(subscriptions.id, subscriptionId)).limit(1);
  assert.equal(subscription?.cancelAtPeriodEnd, true);
});
