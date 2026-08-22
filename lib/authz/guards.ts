import { and, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, businesses, projects, workspaceMembers, workspaces } from "@/lib/db/schema";
import { isPlatformAdmin } from "./admin";
import { AuthzError } from "./errors";
import {
  canManageBilling,
  canManageBrands,
  canManageLibrary,
  canManageMembers,
  canProduce,
  roleAtLeast,
  type WorkspaceRole,
} from "./roles";

export type WorkspaceAuthz = {
  userId: string;
  workspace: typeof workspaces.$inferSelect;
  member: typeof workspaceMembers.$inferSelect;
};

export async function requireWorkspaceMember(
  db: Db,
  userId: string,
  workspaceId: string,
): Promise<WorkspaceAuthz> {
  const [workspace] = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.id, workspaceId))
    .limit(1);
  if (!workspace) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that studio.");
  }

  const [member] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.workspaceId, workspaceId), eq(workspaceMembers.userId, userId)))
    .limit(1);

  if (!member) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that studio.");
  }

  return { userId, workspace, member };
}

export async function requireWorkspaceRole(
  db: Db,
  userId: string,
  workspaceId: string,
  minimum: WorkspaceRole,
): Promise<WorkspaceAuthz> {
  const ctx = await requireWorkspaceMember(db, userId, workspaceId);
  if (!roleAtLeast(ctx.member.role, minimum)) {
    throw new AuthzError("FORBIDDEN", "Your role cannot do that in this studio.");
  }
  return ctx;
}

export async function requireBusinessAccess(db: Db, userId: string, businessId: string) {
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!business) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that brand.");
  }
  const ctx = await requireWorkspaceMember(db, userId, business.workspaceId);
  return { ...ctx, business };
}

export async function requireProjectAccess(db: Db, userId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  if (!project || project.deletedAt) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that commercial.");
  }
  const ctx = await requireWorkspaceMember(db, userId, project.workspaceId);
  return { ...ctx, project };
}

export async function requireAssetAccess(db: Db, userId: string, assetId: string) {
  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  if (!asset) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that file.");
  }
  const ctx = await requireWorkspaceMember(db, userId, asset.workspaceId);
  if (asset.category === "identity" && asset.ownerUserId !== userId) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that file.");
  }
  return { ...ctx, asset };
}

export function assertCanStartProduction(ctx: WorkspaceAuthz): void {
  if (ctx.workspace.status !== "active") {
    throw new AuthzError("SUSPENDED", "This studio is paused, so production cannot start.");
  }
  if (ctx.member.status !== "active") {
    throw new AuthzError("SUSPENDED", "This account is paused, so production cannot start.");
  }
  if (!canProduce(ctx.member.role)) {
    throw new AuthzError(
      "FORBIDDEN",
      "Viewers can watch finished commercials but cannot produce a new one.",
    );
  }
}

export function assertCanManageBilling(ctx: WorkspaceAuthz): void {
  if (!canManageBilling(ctx.member.role)) {
    throw new AuthzError("FORBIDDEN", "Only the studio owner can change billing.");
  }
}

export function assertCanManageBrands(ctx: WorkspaceAuthz): void {
  if (!canManageBrands(ctx.member.role)) {
    throw new AuthzError("FORBIDDEN", "Your role cannot change brands in this studio.");
  }
}

export function assertCanManageMembers(ctx: WorkspaceAuthz): void {
  if (ctx.member.status !== "active") {
    throw new AuthzError("SUSPENDED", "This account is paused, so the team cannot be changed.");
  }
  if (!canManageMembers(ctx.member.role)) {
    throw new AuthzError("FORBIDDEN", "Only studio owners and admins can invite teammates.");
  }
}

export function assertCanManageLibrary(ctx: WorkspaceAuthz): void {
  if (ctx.member.status !== "active") {
    throw new AuthzError("SUSPENDED", "This account is paused, so files cannot be changed.");
  }
  if (!canManageLibrary(ctx.member.role)) {
    throw new AuthzError(
      "FORBIDDEN",
      "Viewers can look at saved files but cannot add or remove them.",
    );
  }
}

export function assertPlatformAdmin(email: string, adminEmails: string[]): void {
  if (!isPlatformAdmin(email, adminEmails)) {
    throw new AuthzError("FORBIDDEN", "Admin pages are limited to Production30 staff.");
  }
}
