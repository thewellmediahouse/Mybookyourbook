import { and, eq } from "drizzle-orm";
import { assertCanManageMembers, type WorkspaceAuthz } from "@/lib/authz/guards";
import { AuthzError } from "@/lib/authz/errors";
import { canManageMembers, isInvitableRole, type WorkspaceRole } from "@/lib/authz/roles";
import type { Db } from "@/lib/db/client";
import { auditLogs, workspaceMembers } from "@/lib/db/schema";
import { newId } from "@/lib/id";

export function canChangeMemberRole(
  actorRole: WorkspaceRole,
  targetRole: WorkspaceRole,
  isSelf: boolean,
): boolean {
  if (isSelf) {
    return false;
  }
  if (!canManageMembers(actorRole)) {
    return false;
  }
  if (targetRole === "OWNER") {
    return false;
  }
  if (actorRole === "ADMIN" && targetRole === "ADMIN") {
    return false;
  }
  return true;
}

export async function changeMemberRole(
  db: Db,
  actor: WorkspaceAuthz,
  input: { memberId: string; role: string },
): Promise<void> {
  assertCanManageMembers(actor);
  if (!isInvitableRole(input.role)) {
    throw new Error("Choose Admin, Creator, or Viewer. A studio can have only one owner.");
  }

  const [target] = await db
    .select()
    .from(workspaceMembers)
    .where(and(eq(workspaceMembers.id, input.memberId), eq(workspaceMembers.workspaceId, actor.workspace.id)))
    .limit(1);
  if (!target) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that studio.");
  }
  if (!canChangeMemberRole(actor.member.role, target.role, target.userId === actor.userId)) {
    throw new AuthzError("FORBIDDEN", "Only studio owners and admins can change that role.");
  }
  if (target.role === input.role) {
    return;
  }

  const now = new Date();
  await db
    .update(workspaceMembers)
    .set({ role: input.role })
    .where(eq(workspaceMembers.id, target.id));

  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: actor.workspace.id,
    action: "member.role_changed",
    targetType: "workspace_member",
    targetId: target.id,
    metadataJson: JSON.stringify({ from: target.role, to: input.role, userId: target.userId }),
    createdAt: now,
  });
}
