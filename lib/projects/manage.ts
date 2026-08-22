import { and, eq, isNull } from "drizzle-orm";
import { assertCanStartProduction, type WorkspaceAuthz } from "@/lib/authz/guards";
import type { Db } from "@/lib/db/client";
import { projects } from "@/lib/db/schema";
import { isInProductionStatus } from "./status";
import {
  ALREADY_ARCHIVED,
  ARCHIVE_ONLY_FINISHED,
  IN_PRODUCTION_LOCK,
} from "./delivery";

const ARCHIVABLE_STATUSES = new Set(["READY", "FAILED"]);

export async function renameProject(db: Db, ctx: WorkspaceAuthz, projectId: string, title: string) {
  const project = await loadOwnedProject(db, ctx, projectId);
  const next = title.trim();
  if (!next) {
    throw new Error("Give this campaign a title.");
  }
  await db
    .update(projects)
    .set({ title: next, updatedAt: new Date() })
    .where(eq(projects.id, project.id));
}

export async function archiveProject(db: Db, ctx: WorkspaceAuthz, projectId: string) {
  const project = await loadOwnedProject(db, ctx, projectId);
  if (isInProductionStatus(project.status)) {
    throw new Error(IN_PRODUCTION_LOCK);
  }
  if (project.status === "ARCHIVED") {
    throw new Error(ALREADY_ARCHIVED);
  }
  if (!ARCHIVABLE_STATUSES.has(project.status)) {
    throw new Error(ARCHIVE_ONLY_FINISHED);
  }
  await db
    .update(projects)
    .set({ status: "ARCHIVED", updatedAt: new Date() })
    .where(eq(projects.id, project.id));
}

export async function deleteProject(db: Db, ctx: WorkspaceAuthz, projectId: string) {
  const project = await loadOwnedProject(db, ctx, projectId);
  if (isInProductionStatus(project.status)) {
    throw new Error(IN_PRODUCTION_LOCK);
  }
  const now = new Date();
  await db
    .update(projects)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(projects.id, project.id));
}

async function loadOwnedProject(db: Db, ctx: WorkspaceAuthz, projectId: string) {
  assertCanStartProduction(ctx);
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);
  if (!project || project.workspaceId !== ctx.workspace.id) {
    throw new Error("You do not have access to that commercial.");
  }
  return project;
}
