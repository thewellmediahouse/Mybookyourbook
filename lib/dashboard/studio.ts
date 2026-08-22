import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import type { WorkspaceRole } from "@/lib/authz/roles";
import { getDb, type Db } from "@/lib/db/client";
import {
  ACTIVE_WORKSPACE_COOKIE,
  listUserWorkspaces,
  type WorkspaceListItem,
} from "@/lib/workspaces/queries";
import { ACTIVE_BRAND_COOKIE, resolveActiveBrand } from "@/lib/businesses/queries";

export type StudioContext = {
  db: Db;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  workspaces: WorkspaceListItem[];
  active: WorkspaceListItem;
  role: WorkspaceRole;
  memberStatus: string;
  workspaceStatus: string;
  activeBrandId: string | null;
};

export async function requireStudio(): Promise<StudioContext> {
  const session = await requireUser();
  const db = await getDb();
  const workspaces = await listUserWorkspaces(db, session.user.id);
  if (workspaces.length === 0) {
    redirect("/onboarding");
  }
  const preferred = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = workspaces.find((item) => item.workspaceId === preferred) ?? workspaces[0];
  const preferredBrand = (await cookies()).get(ACTIVE_BRAND_COOKIE)?.value;
  const activeBrandId = resolveActiveBrand(active.businesses, preferredBrand);
  const firstName =
    typeof session.user.firstName === "string" && session.user.firstName.trim()
      ? session.user.firstName.trim()
      : session.user.name.split(/\s+/)[0] || "there";
  const lastName =
    typeof session.user.lastName === "string" && session.user.lastName.trim()
      ? session.user.lastName.trim()
      : session.user.name.split(/\s+/).slice(1).join(" ");

  return {
    db,
    userId: session.user.id,
    email: session.user.email,
    firstName,
    lastName,
    workspaces,
    active,
    role: active.role,
    memberStatus: active.status,
    workspaceStatus: active.workspaceStatus,
    activeBrandId,
  };
}
