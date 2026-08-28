import { eq } from "drizzle-orm";
import { assertAdminActor } from "@/lib/admin/access";
import type { Db } from "@/lib/db/client";
import { auditLogs, payments, subscriptions } from "@/lib/db/schema";
import { newId } from "@/lib/id";

function parseMetadata(raw: string | null): Record<string, unknown> {
  if (!raw?.trim()) {
    return {};
  }
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export async function adminRecordMoneyRefund(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: { paymentId: string; note: string; ticketId?: string | null },
) {
  assertAdminActor(actor.email, actor.adminEmails);
  const note = input.note.trim();
  if (note.length < 8) {
    throw new Error("Note where you returned the money (for example in the Rapyd Client Portal).");
  }
  const [payment] = await db.select().from(payments).where(eq(payments.id, input.paymentId)).limit(1);
  if (!payment) {
    throw new Error("That payment was not found.");
  }
  if (payment.status === "refunded") {
    throw new Error("This payment is already marked as money returned.");
  }
  if (payment.status !== "success") {
    throw new Error("Only a confirmed payment can be marked as money returned.");
  }
  const now = new Date();
  const metadata = {
    ...parseMetadata(payment.metadataJson),
    moneyRefundNote: note,
    moneyRefundAt: now.toISOString(),
    moneyRefundTicketId: input.ticketId?.trim() || null,
  };
  await db
    .update(payments)
    .set({
      status: "refunded",
      metadataJson: JSON.stringify(metadata),
      updatedAt: now,
    })
    .where(eq(payments.id, payment.id));
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: payment.workspaceId,
    action: "admin.payment_money_refunded",
    targetType: "payment",
    targetId: payment.id,
    metadataJson: JSON.stringify({ note, ticketId: input.ticketId?.trim() || null }),
    createdAt: now,
  });
  return { id: payment.id, status: "refunded" as const };
}

export async function adminMarkCancelAtPeriodEnd(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: { subscriptionId: string },
) {
  assertAdminActor(actor.email, actor.adminEmails);
  const [subscription] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.id, input.subscriptionId))
    .limit(1);
  if (!subscription) {
    throw new Error("That plan was not found.");
  }
  if (subscription.cancelAtPeriodEnd) {
    throw new Error("This plan already cancels at the end of the current period.");
  }
  const now = new Date();
  await db
    .update(subscriptions)
    .set({ cancelAtPeriodEnd: true, updatedAt: now })
    .where(eq(subscriptions.id, subscription.id));
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: subscription.workspaceId,
    action: "admin.subscription_cancel_at_period_end",
    targetType: "subscription",
    targetId: subscription.id,
    metadataJson: JSON.stringify({ provider: subscription.provider }),
    createdAt: now,
  });
  return { id: subscription.id, cancelAtPeriodEnd: true };
}
