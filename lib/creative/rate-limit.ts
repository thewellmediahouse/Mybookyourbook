import { and, eq, gt } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { creativeVersions, projects } from "@/lib/db/schema";
import { CONCEPT_RATE_LIMIT } from "./copy";

export const CONCEPT_RATE_WINDOW_MS = 10 * 60 * 1000;
export const CONCEPT_RATE_MAX = 8;

export async function assertConceptRateLimit(db: Db, workspaceId: string) {
  const since = new Date(Date.now() - CONCEPT_RATE_WINDOW_MS);
  const rows = await db
    .select({ id: creativeVersions.id })
    .from(creativeVersions)
    .innerJoin(projects, eq(projects.id, creativeVersions.projectId))
    .where(and(eq(projects.workspaceId, workspaceId), gt(creativeVersions.createdAt, since)));
  if (rows.length >= CONCEPT_RATE_MAX) {
    throw new Error(CONCEPT_RATE_LIMIT);
  }
}
