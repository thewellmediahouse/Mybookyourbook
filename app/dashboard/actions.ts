"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { loadWorkspaceMember } from "@/lib/authz";
import { getDb } from "@/lib/db/client";
import { ACTIVE_BRAND_COOKIE } from "@/lib/businesses/queries";
import { ACTIVE_WORKSPACE_COOKIE } from "@/lib/workspaces/queries";

export async function switchWorkspace(formData: FormData) {
  const session = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const db = await getDb();
  await loadWorkspaceMember(db, session.user.id, workspaceId);
  const jar = await cookies();
  jar.set(ACTIVE_WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
  jar.delete(ACTIVE_BRAND_COOKIE);
  redirect("/dashboard");
}
