import { assertCanStartProduction, loadProjectAccess } from "@/lib/authz";
import { getDb } from "@/lib/db/client";
import { requireApiSession } from "./auth";

export async function requireProjectEditor(projectId: string) {
  const session = await requireApiSession();
  const db = await getDb();
  const access = await loadProjectAccess(db, session.user.id, projectId);
  assertCanStartProduction(access);
  if (access.project.deletedAt) {
    throw new Error("That commercial is no longer available.");
  }
  return {
    session,
    db,
    userId: session.user.id,
    workspaceId: access.workspace.id,
    businessId: access.project.businessId,
    project: access.project,
  };
}
