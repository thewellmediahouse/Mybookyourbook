import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { businesses, workspaceMembers, workspaces } from "@/lib/db/schema";

export const ACTIVE_WORKSPACE_COOKIE = "cineyou_workspace";

export type WorkspaceListItem = {
  workspaceId: string;
  name: string;
  type: (typeof workspaces.$inferSelect)["type"];
  role: (typeof workspaceMembers.$inferSelect)["role"];
  status: string;
  workspaceStatus: string;
  businesses: { id: string; name: string }[];
};

export async function listUserWorkspaces(db: Db, userId: string): Promise<WorkspaceListItem[]> {
  const memberships = await db
    .select({
      workspaceId: workspaces.id,
      name: workspaces.name,
      type: workspaces.type,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
      workspaceStatus: workspaces.status,
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId));

  const items: WorkspaceListItem[] = [];
  for (const membership of memberships) {
    const brands = await db
      .select({ id: businesses.id, name: businesses.name })
      .from(businesses)
      .where(eq(businesses.workspaceId, membership.workspaceId));
    items.push({
      workspaceId: membership.workspaceId,
      name: membership.name,
      type: membership.type,
      role: membership.role,
      status: membership.status,
      workspaceStatus: membership.workspaceStatus,
      businesses: brands,
    });
  }
  return items;
}

export async function resolveActiveWorkspace(
  db: Db,
  userId: string,
  preferredWorkspaceId: string | undefined,
): Promise<WorkspaceListItem | null> {
  const items = await listUserWorkspaces(db, userId);
  if (items.length === 0) {
    return null;
  }
  if (preferredWorkspaceId) {
    const match = items.find((item) => item.workspaceId === preferredWorkspaceId);
    if (match) {
      return match;
    }
  }
  return items[0] ?? null;
}

export async function userHasWorkspace(db: Db, userId: string): Promise<boolean> {
  const [row] = await db
    .select({ id: workspaceMembers.id })
    .from(workspaceMembers)
    .where(eq(workspaceMembers.userId, userId))
    .limit(1);
  return Boolean(row);
}
