"use server";

import { getCloudflareContext } from "@opennextjs/cloudflare";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getAuthBaseUrl } from "@/lib/auth/env";
import { assertCanManageMembers, loadWorkspaceMember } from "@/lib/authz";
import { getDb } from "@/lib/db/client";
import { INVITE_SENT, ROLE_CHANGED } from "@/lib/workspaces/copy";
import { createInvitation } from "@/lib/workspaces/invite";
import { changeMemberRole } from "@/lib/workspaces/members";
import { ACTIVE_WORKSPACE_COOKIE, listUserWorkspaces } from "@/lib/workspaces/queries";
import { cookies } from "next/headers";

export type TeamActionState = { error?: string; message?: string };

async function requireTeamEditor() {
  const session = await requireUser();
  const db = await getDb();
  const workspaces = await listUserWorkspaces(db, session.user.id);
  if (workspaces.length === 0) {
    throw new Error("You do not have access to that studio.");
  }
  const preferred = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = workspaces.find((item) => item.workspaceId === preferred) ?? workspaces[0];
  const member = await loadWorkspaceMember(db, session.user.id, active.workspaceId);
  assertCanManageMembers(member);
  return { db, member };
}

export async function inviteTeammateAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    const ctx = await requireTeamEditor();
    const { env } = await getCloudflareContext({ async: true });
    await createInvitation(
      ctx.db,
      ctx.member,
      {
        email: String(formData.get("email") ?? ""),
        role: String(formData.get("role") ?? ""),
      },
      { appUrl: getAuthBaseUrl(env), env },
    );
    revalidatePath("/dashboard/team");
    return { message: INVITE_SENT };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't send that invitation." };
  }
}

export async function changeMemberRoleAction(
  _prev: TeamActionState,
  formData: FormData,
): Promise<TeamActionState> {
  try {
    const ctx = await requireTeamEditor();
    await changeMemberRole(ctx.db, ctx.member, {
      memberId: String(formData.get("memberId") ?? ""),
      role: String(formData.get("role") ?? ""),
    });
    revalidatePath("/dashboard/team");
    return { message: ROLE_CHANGED };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't update that role." };
  }
}
