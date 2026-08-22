import { getCloudflareContext } from "@opennextjs/cloudflare";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { parseAdminEmails } from "./admin";
import { AuthzError } from "./errors";
import {
  requireAssetAccess as loadAssetAccess,
  requireBusinessAccess as loadBusinessAccess,
  requireProjectAccess as loadProjectAccess,
  requireWorkspaceMember as loadWorkspaceMember,
  requireWorkspaceRole as loadWorkspaceRole,
  assertPlatformAdmin,
} from "./guards";
import type { WorkspaceRole } from "./roles";

function deny(error: unknown): never {
  if (error instanceof AuthzError && error.code === "UNAUTHENTICATED") {
    redirect("/login");
  }
  notFound();
}

export async function requireAdmin() {
  const session = await requireUser();
  const { env } = await getCloudflareContext({ async: true });
  const emails = parseAdminEmails(
    "ADMIN_EMAILS" in env ? String((env as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "") : "",
  );
  try {
    assertPlatformAdmin(session.user.email, emails);
  } catch (error) {
    deny(error);
  }
  return session;
}

export async function requireWorkspaceMember(workspaceId: string) {
  const session = await requireUser();
  const db = await getDb();
  try {
    return await loadWorkspaceMember(db, session.user.id, workspaceId);
  } catch (error) {
    deny(error);
  }
}

export async function requireWorkspaceRole(workspaceId: string, role: WorkspaceRole) {
  const session = await requireUser();
  const db = await getDb();
  try {
    return await loadWorkspaceRole(db, session.user.id, workspaceId, role);
  } catch (error) {
    deny(error);
  }
}

export async function requireBusinessAccess(businessId: string) {
  const session = await requireUser();
  const db = await getDb();
  try {
    return await loadBusinessAccess(db, session.user.id, businessId);
  } catch (error) {
    deny(error);
  }
}

export async function requireProjectAccess(projectId: string) {
  const session = await requireUser();
  const db = await getDb();
  try {
    return await loadProjectAccess(db, session.user.id, projectId);
  } catch (error) {
    deny(error);
  }
}

export async function requireAssetAccess(assetId: string) {
  const session = await requireUser();
  const db = await getDb();
  try {
    return await loadAssetAccess(db, session.user.id, assetId);
  } catch (error) {
    deny(error);
  }
}
