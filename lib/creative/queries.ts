import { and, desc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { creativeVersions } from "@/lib/db/schema";
import { toPublicConcept } from "./public";

export async function getLatestCreativeVersion(db: Db, projectId: string) {
  const [row] = await db
    .select()
    .from(creativeVersions)
    .where(eq(creativeVersions.projectId, projectId))
    .orderBy(desc(creativeVersions.version))
    .limit(1);
  return row ?? null;
}

export async function getPublicConcept(db: Db, projectId: string) {
  const row = await getLatestCreativeVersion(db, projectId);
  return row ? toPublicConcept(row) : null;
}

export async function getCreativeVersion(db: Db, projectId: string, versionId: string) {
  const [row] = await db
    .select()
    .from(creativeVersions)
    .where(and(eq(creativeVersions.id, versionId), eq(creativeVersions.projectId, projectId)))
    .limit(1);
  return row ?? null;
}
