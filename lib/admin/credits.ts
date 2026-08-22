import { eq } from "drizzle-orm";
import { assertAdminActor } from "@/lib/admin/access";
import { deductCredits, grantCredits } from "@/lib/credits/ledger";
import type { Db } from "@/lib/db/client";
import { auditLogs, supportTickets, workspaceMembers, workspaces } from "@/lib/db/schema";
import { newId } from "@/lib/id";

export async function adminGrantCredits(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: { workspaceId: string; amount: number; reason: string },
) {
  assertAdminActor(actor.email, actor.adminEmails);
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Enter a reason for the credit change.");
  }
  const row = await grantCredits(db, {
    workspaceId: input.workspaceId,
    amount: input.amount,
    type: "ADMIN_ADJUSTMENT",
    idempotencyKey: `admin-grant:${input.workspaceId}:${newId()}`,
    description: reason,
  });
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: input.workspaceId,
    action: "admin.credit_granted",
    targetType: "credit_wallet",
    targetId: input.workspaceId,
    metadataJson: JSON.stringify({ amount: input.amount, reason, transactionId: row.id }),
    createdAt: new Date(),
  });
  return row;
}

export async function adminDeductCredits(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: { workspaceId: string; amount: number; reason: string },
) {
  assertAdminActor(actor.email, actor.adminEmails);
  const reason = input.reason.trim();
  if (!reason) {
    throw new Error("Enter a reason for the credit change.");
  }
  const row = await deductCredits(db, {
    workspaceId: input.workspaceId,
    amount: input.amount,
    idempotencyKey: `admin-deduct:${input.workspaceId}:${newId()}`,
    description: reason,
  });
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: input.workspaceId,
    action: "admin.credit_deducted",
    targetType: "credit_wallet",
    targetId: input.workspaceId,
    metadataJson: JSON.stringify({ amount: input.amount, reason, transactionId: row.id }),
    createdAt: new Date(),
  });
  return row;
}

export async function adminSetMemberStatus(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: { userId: string; status: "active" | "suspended" },
) {
  assertAdminActor(actor.email, actor.adminEmails);
  await db
    .update(workspaceMembers)
    .set({ status: input.status })
    .where(eq(workspaceMembers.userId, input.userId));
  const owned = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.ownerUserId, input.userId));
  for (const studio of owned) {
    await db
      .update(workspaces)
      .set({ status: input.status === "suspended" ? "suspended" : "active", updatedAt: new Date() })
      .where(eq(workspaces.id, studio.id));
  }
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    action: input.status === "suspended" ? "admin.user_suspended" : "admin.user_unsuspended",
    targetType: "user",
    targetId: input.userId,
    createdAt: new Date(),
  });
}

export async function adminSetTicketStatus(
  db: Db,
  actor: { userId: string; email: string; adminEmails: string[] },
  input: { ticketId: string; status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" },
) {
  assertAdminActor(actor.email, actor.adminEmails);
  await db
    .update(supportTickets)
    .set({ status: input.status, updatedAt: new Date() })
    .where(eq(supportTickets.id, input.ticketId));
}
