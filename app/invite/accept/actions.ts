"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { ACTIVE_BRAND_COOKIE } from "@/lib/businesses/queries";
import { INVALID_INVITE } from "@/lib/workspaces/copy";
import { acceptInvitation } from "@/lib/workspaces/invite";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspaces/queries";

export type AcceptInviteState = { error?: string };

export async function acceptInviteAction(
  _prev: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const session = await getSession();
  if (!session) {
    return { error: "Sign in to join this studio." };
  }
  const token = String(formData.get("token") ?? "");
  if (!token) {
    return { error: INVALID_INVITE };
  }
  try {
    const db = await getDb();
    const result = await acceptInvitation(db, {
      userId: session.user.id,
      email: session.user.email,
      token,
    });
    const jar = await cookies();
    jar.set(ACTIVE_WORKSPACE_COOKIE, result.workspaceId, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    jar.delete(ACTIVE_BRAND_COOKIE);
  } catch (error) {
    return { error: error instanceof Error ? error.message : INVALID_INVITE };
  }
  redirect("/dashboard/team");
}
