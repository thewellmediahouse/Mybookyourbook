export const WORKSPACE_ROLES = ["OWNER", "ADMIN", "CREATOR", "VIEWER"] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const INVITABLE_ROLES = ["ADMIN", "CREATOR", "VIEWER"] as const;
export type InvitableRole = (typeof INVITABLE_ROLES)[number];

export const WORKSPACE_TYPES = ["BUSINESS", "AGENCY"] as const;
export type WorkspaceType = (typeof WORKSPACE_TYPES)[number];

export const ROLE_RANK: Record<WorkspaceRole, number> = {
  VIEWER: 1,
  CREATOR: 2,
  ADMIN: 3,
  OWNER: 4,
};

export function isWorkspaceRole(value: string): value is WorkspaceRole {
  return (WORKSPACE_ROLES as readonly string[]).includes(value);
}

export function isInvitableRole(value: string): value is InvitableRole {
  return (INVITABLE_ROLES as readonly string[]).includes(value);
}

export function roleAtLeast(actual: WorkspaceRole, minimum: WorkspaceRole): boolean {
  return ROLE_RANK[actual] >= ROLE_RANK[minimum];
}

/** Produce a commercial, edit campaigns, spend credits. */
export function canProduce(role: WorkspaceRole): boolean {
  return roleAtLeast(role, "CREATOR");
}

/** Invite members and change roles. */
export function canManageMembers(role: WorkspaceRole): boolean {
  return roleAtLeast(role, "ADMIN");
}

/** Create and edit brands in the workspace. */
export function canManageBrands(role: WorkspaceRole): boolean {
  return roleAtLeast(role, "ADMIN");
}

/** Add and remove reusable library files (not the official brand logo). */
export function canManageLibrary(role: WorkspaceRole): boolean {
  return roleAtLeast(role, "CREATOR");
}

/** Plan, payment method, and workspace billing. OWNER only. */
export function canManageBilling(role: WorkspaceRole): boolean {
  return role === "OWNER";
}
