import type { InvitableRole, WorkspaceRole, WorkspaceType } from "@/lib/authz/roles";

export const TEAM_TITLE = "Team";
export const TEAM_DESCRIPTION =
  "People who can use this studio. Owners and admins can invite teammates by email.";
export const TEAM_AGENCY_DESCRIPTION =
  "People who can use this studio. Invite your team. Client brands stay on Brands — a separate client login is not available yet.";
export const BRANDS_DESCRIPTION =
  "Switch brands in the studio menu. Each brand keeps its own logo and details.";
export const BRANDS_AGENCY_DESCRIPTION =
  "Switch brands in the studio menu. An agency studio can look after more than one client brand. A separate client login is not available yet.";
export const INVITE_BUTTON = "Send invitation";
export const INVITE_SENT = "Invitation sent. It expires in 7 days.";
export const INVITE_EXPIRES = "Invitations expire after 7 days.";
export const VIEWER_CANNOT_INVITE = "Only studio owners and admins can invite teammates.";
export const JOIN_STUDIO = "Join this studio";
export const INVALID_INVITE = "This invitation is not valid or has expired.";
export const INVITE_WRONG_EMAIL = "Sign in with the email this invitation was sent to.";
export const ROLE_CHANGED = "Role updated.";

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  CREATOR: "Creator",
  VIEWER: "Viewer",
};

export function teamDescription(type: WorkspaceType): string {
  return type === "AGENCY" ? TEAM_AGENCY_DESCRIPTION : TEAM_DESCRIPTION;
}

export function brandsDescription(type: WorkspaceType): string {
  return type === "AGENCY" ? BRANDS_AGENCY_DESCRIPTION : BRANDS_DESCRIPTION;
}

export function roleLabel(role: WorkspaceRole | InvitableRole): string {
  return ROLE_LABELS[role];
}

export function inviteEmailBody(workspaceName: string): string {
  return `You've been invited to join ${workspaceName} on Production30. This invitation expires in 7 days.`;
}
