import { cookies } from "next/headers";
import { assertCanManageBilling, loadWorkspaceMember } from "@/lib/authz";
import { AuthzError } from "@/lib/authz/errors";
import { getDb } from "@/lib/db/client";
import { ACTIVE_WORKSPACE_COOKIE, listUserWorkspaces } from "@/lib/workspaces/queries";
import { requireApiSession } from "./auth";

export async function requireBillingOwner() {
  const session = await requireApiSession();
  const db = await getDb();
  const workspaces = await listUserWorkspaces(db, session.user.id);
  if (workspaces.length === 0) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that studio.");
  }
  const preferred = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = workspaces.find((item) => item.workspaceId === preferred) ?? workspaces[0];
  const member = await loadWorkspaceMember(db, session.user.id, active.workspaceId);
  assertCanManageBilling(member);
  return {
    session,
    db,
    userId: session.user.id,
    email: session.user.email,
    workspaceId: active.workspaceId,
    member,
  };
}
