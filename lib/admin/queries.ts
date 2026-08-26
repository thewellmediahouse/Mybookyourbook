import { and, count, desc, eq, inArray, isNotNull, isNull, sql, sum } from "drizzle-orm";
import { asCount } from "@/lib/dashboard/format";
import type { Db } from "@/lib/db/client";
import {
  assets,
  auditLogs,
  creditTransactions,
  creditWallets,
  payments,
  productionJobs,
  projects,
  subscriptions,
  supportReplies,
  supportTickets,
  user,
  workspaceMembers,
  workspaces,
} from "@/lib/db/schema";
import { IN_FLIGHT_JOB_STATUSES } from "@/lib/production/status";

export type AdminOverview = {
  users: number;
  payingWorkspaces: number;
  commercialsProduced: number;
  activeJobs: number;
  failedJobs: number;
  revenueZarMinor: number;
  revenueUsdMinor: number;
  creditsSold: number;
  estimatedAiCostUsd: number;
  estimatedGrossMarginUsd: number;
  approxStorageBytes: number;
  openTickets: number;
};

export async function getAdminOverview(db: Db): Promise<AdminOverview> {
  const [usersRow] = await db.select({ value: count() }).from(user);
  const [produced] = await db
    .select({ value: count() })
    .from(projects)
    .where(and(eq(projects.status, "READY"), isNull(projects.deletedAt)));
  const [active] = await db
    .select({ value: count() })
    .from(productionJobs)
    .where(inArray(productionJobs.status, IN_FLIGHT_JOB_STATUSES));
  const [failed] = await db
    .select({ value: count() })
    .from(productionJobs)
    .where(eq(productionJobs.status, "FAILED"));
  const [zar] = await db
    .select({ value: sum(payments.amountMinor) })
    .from(payments)
    .where(and(eq(payments.status, "success"), eq(payments.currency, "ZAR")));
  const [usd] = await db
    .select({ value: sum(payments.amountMinor) })
    .from(payments)
    .where(and(eq(payments.status, "success"), eq(payments.currency, "USD")));
  const [credits] = await db
    .select({ value: sum(creditTransactions.amount) })
    .from(creditTransactions)
    .where(inArray(creditTransactions.type, ["PURCHASE", "SUBSCRIPTION_GRANT"]));
  const [aiCost] = await db
    .select({ value: sum(productionJobs.estimatedProviderCostUsd) })
    .from(productionJobs);
  const [storage] = await db
    .select({ value: sum(assets.sizeBytes) })
    .from(assets)
    .where(isNull(assets.deletedAt));
  const [paying] = await db
    .select({ value: sql<number>`count(distinct ${payments.workspaceId})` })
    .from(payments)
    .where(eq(payments.status, "success"));
  const [tickets] = await db
    .select({ value: count() })
    .from(supportTickets)
    .where(inArray(supportTickets.status, ["OPEN", "IN_PROGRESS"]));

  const estimatedAiCostUsd = asCount(aiCost?.value);
  const revenueUsdMinor = asCount(usd?.value);
  return {
    users: asCount(usersRow?.value),
    payingWorkspaces: asCount(paying?.value),
    commercialsProduced: asCount(produced?.value),
    activeJobs: asCount(active?.value),
    failedJobs: asCount(failed?.value),
    revenueZarMinor: asCount(zar?.value),
    revenueUsdMinor,
    creditsSold: asCount(credits?.value),
    estimatedAiCostUsd,
    estimatedGrossMarginUsd: Math.round(revenueUsdMinor / 100) - estimatedAiCostUsd,
    approxStorageBytes: asCount(storage?.value),
    openTickets: asCount(tickets?.value),
  };
}

export async function listAdminUsers(db: Db, limit = 100) {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt))
    .limit(limit);
}

export async function getAdminUser(db: Db, userId: string) {
  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);
  if (!row) {
    return null;
  }
  const memberships = await db
    .select({
      workspaceId: workspaces.id,
      workspaceName: workspaces.name,
      workspaceStatus: workspaces.status,
      role: workspaceMembers.role,
      memberStatus: workspaceMembers.status,
      planCode: workspaces.planCode,
      credits: creditWallets.balance,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .leftJoin(creditWallets, eq(creditWallets.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));
  const userProjects = await db
    .select({ id: projects.id, title: projects.title, status: projects.status, workspaceId: projects.workspaceId })
    .from(projects)
    .where(eq(projects.createdByUserId, userId))
    .orderBy(desc(projects.updatedAt))
    .limit(50);
  const userPayments = await db
    .select({
      id: payments.id,
      amountMinor: payments.amountMinor,
      currency: payments.currency,
      status: payments.status,
      workspaceId: payments.workspaceId,
      createdAt: payments.createdAt,
    })
    .from(payments)
    .innerJoin(workspaces, eq(payments.workspaceId, workspaces.id))
    .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(desc(payments.createdAt))
    .limit(50);
  const jobs = await db
    .select({
      id: productionJobs.id,
      status: productionJobs.status,
      projectId: productionJobs.projectId,
      workspaceId: productionJobs.workspaceId,
      createdAt: productionJobs.createdAt,
    })
    .from(productionJobs)
    .innerJoin(workspaceMembers, eq(workspaceMembers.workspaceId, productionJobs.workspaceId))
    .where(eq(workspaceMembers.userId, userId))
    .orderBy(desc(productionJobs.createdAt))
    .limit(50);
  const tickets = await db
    .select()
    .from(supportTickets)
    .where(eq(supportTickets.userId, userId))
    .orderBy(desc(supportTickets.createdAt))
    .limit(50);
  return { user: row, memberships, projects: userProjects, payments: userPayments, jobs, tickets };
}

export async function listAdminWorkspaces(db: Db, limit = 100) {
  return db
    .select({
      id: workspaces.id,
      name: workspaces.name,
      type: workspaces.type,
      status: workspaces.status,
      planCode: workspaces.planCode,
      billingCurrency: workspaces.billingCurrency,
      credits: creditWallets.balance,
      ownerEmail: user.email,
    })
    .from(workspaces)
    .innerJoin(user, eq(workspaces.ownerUserId, user.id))
    .leftJoin(creditWallets, eq(creditWallets.workspaceId, workspaces.id))
    .orderBy(desc(workspaces.createdAt))
    .limit(limit);
}

export async function listAdminCommercials(db: Db, limit = 100) {
  return db
    .select({
      id: projects.id,
      title: projects.title,
      status: projects.status,
      workspaceId: projects.workspaceId,
      createdAt: projects.createdAt,
    })
    .from(projects)
    .where(isNull(projects.deletedAt))
    .orderBy(desc(projects.updatedAt))
    .limit(limit);
}

export async function listAdminJobs(db: Db, status?: string, limit = 100) {
  if (status) {
    return db
      .select({
        id: productionJobs.id,
        status: productionJobs.status,
        projectId: productionJobs.projectId,
        workspaceId: productionJobs.workspaceId,
        failureType: productionJobs.failureType,
        createdAt: productionJobs.createdAt,
        completedAt: productionJobs.completedAt,
      })
      .from(productionJobs)
      .where(eq(productionJobs.status, status))
      .orderBy(desc(productionJobs.createdAt))
      .limit(limit);
  }
  return db
    .select({
      id: productionJobs.id,
      status: productionJobs.status,
      projectId: productionJobs.projectId,
      workspaceId: productionJobs.workspaceId,
      failureType: productionJobs.failureType,
      createdAt: productionJobs.createdAt,
      completedAt: productionJobs.completedAt,
    })
    .from(productionJobs)
    .orderBy(desc(productionJobs.createdAt))
    .limit(limit);
}

export async function listAdminPayments(db: Db, limit = 100) {
  return db.select().from(payments).orderBy(desc(payments.createdAt)).limit(limit);
}

export async function listAdminSubscriptions(db: Db, limit = 100) {
  return db.select().from(subscriptions).orderBy(desc(subscriptions.createdAt)).limit(limit);
}

export async function listAdminCredits(db: Db, limit = 100) {
  return db.select().from(creditTransactions).orderBy(desc(creditTransactions.createdAt)).limit(limit);
}

export async function listAdminTickets(db: Db, limit = 100) {
  return db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      category: supportTickets.category,
      status: supportTickets.status,
      message: supportTickets.message,
      createdAt: supportTickets.createdAt,
      contactEmail: supportTickets.contactEmail,
      contactName: supportTickets.contactName,
      customerName: user.name,
      customerEmail: user.email,
      studioName: workspaces.name,
      workspaceId: supportTickets.workspaceId,
      projectId: supportTickets.projectId,
    })
    .from(supportTickets)
    .leftJoin(user, eq(supportTickets.userId, user.id))
    .leftJoin(workspaces, eq(supportTickets.workspaceId, workspaces.id))
    .orderBy(desc(supportTickets.createdAt))
    .limit(limit);
}

export async function getAdminTicketDetail(db: Db, ticketId: string) {
  const [ticket] = await db
    .select({
      id: supportTickets.id,
      subject: supportTickets.subject,
      category: supportTickets.category,
      status: supportTickets.status,
      message: supportTickets.message,
      createdAt: supportTickets.createdAt,
      updatedAt: supportTickets.updatedAt,
      contactEmail: supportTickets.contactEmail,
      contactName: supportTickets.contactName,
      customerName: user.name,
      customerEmail: user.email,
      studioName: workspaces.name,
      workspaceId: supportTickets.workspaceId,
      projectId: supportTickets.projectId,
      projectTitle: projects.title,
    })
    .from(supportTickets)
    .leftJoin(user, eq(supportTickets.userId, user.id))
    .leftJoin(workspaces, eq(supportTickets.workspaceId, workspaces.id))
    .leftJoin(projects, eq(supportTickets.projectId, projects.id))
    .where(eq(supportTickets.id, ticketId))
    .limit(1);
  if (!ticket) {
    return null;
  }
  const replies = await db
    .select()
    .from(supportReplies)
    .where(eq(supportReplies.ticketId, ticketId))
    .orderBy(supportReplies.createdAt);
  return { ticket, replies };
}

export async function getAdminStorage(db: Db) {
  const [all] = await db
    .select({ files: count(), bytes: sum(assets.sizeBytes) })
    .from(assets)
    .where(isNull(assets.deletedAt));
  const [finals] = await db
    .select({ files: count(), bytes: sum(assets.sizeBytes) })
    .from(assets)
    .where(and(isNull(assets.deletedAt), eq(assets.category, "final")));
  const [identity] = await db
    .select({ files: count(), bytes: sum(assets.sizeBytes) })
    .from(assets)
    .where(and(isNull(assets.deletedAt), eq(assets.category, "identity")));
  const [pending] = await db
    .select({ files: count(), bytes: sum(assets.sizeBytes) })
    .from(assets)
    .where(isNotNull(assets.deletedAt));
  return {
    files: asCount(all?.files),
    bytes: asCount(all?.bytes),
    finalFiles: asCount(finals?.files),
    finalBytes: asCount(finals?.bytes),
    identityFiles: asCount(identity?.files),
    identityBytes: asCount(identity?.bytes),
    pendingDeletion: asCount(pending?.files),
    pendingBytes: asCount(pending?.bytes),
  };
}

export async function listPendingCleanup(db: Db, limit = 200) {
  return db
    .select({
      id: assets.id,
      workspaceId: assets.workspaceId,
      objectKey: assets.r2ObjectKey,
    })
    .from(assets)
    .where(isNotNull(assets.deletedAt))
    .limit(limit);
}

export async function listAdminAudit(db: Db, limit = 100) {
  return db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(limit);
}
