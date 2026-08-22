import { cookies } from "next/headers";
import { assertCanManageLibrary, loadWorkspaceMember } from "@/lib/authz";
import { AuthzError } from "@/lib/authz/errors";
import { ACTIVE_BRAND_COOKIE, resolveActiveBrand } from "@/lib/businesses/queries";
import { getDb } from "@/lib/db/client";
import { ACTIVE_WORKSPACE_COOKIE, listUserWorkspaces } from "@/lib/workspaces/queries";
import { requireApiSession } from "./auth";

export async function requireStudioLibraryWrite() {
  const session = await requireApiSession();
  const db = await getDb();
  const workspaces = await listUserWorkspaces(db, session.user.id);
  if (workspaces.length === 0) {
    throw new AuthzError("FORBIDDEN", "You do not have access to that studio.");
  }
  const preferred = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = workspaces.find((item) => item.workspaceId === preferred) ?? workspaces[0];
  const member = await loadWorkspaceMember(db, session.user.id, active.workspaceId);
  assertCanManageLibrary(member);
  const preferredBrand = (await cookies()).get(ACTIVE_BRAND_COOKIE)?.value;
  const businessId = resolveActiveBrand(active.businesses, preferredBrand);
  if (!businessId) {
    throw new Error("Add a brand before saving files to the library.");
  }
  return {
    session,
    db,
    userId: session.user.id,
    workspaceId: active.workspaceId,
    businessId,
    member,
  };
}
