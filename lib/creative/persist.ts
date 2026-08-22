import { desc, eq } from "drizzle-orm";
import type { CreativeConcept } from "@/lib/ai/creative-director";
import type { Db } from "@/lib/db/client";
import { creativeVersions, projects } from "@/lib/db/schema";
import { newId } from "@/lib/id";

export async function nextCreativeVersion(db: Db, projectId: string): Promise<number> {
  const [latest] = await db
    .select({ version: creativeVersions.version })
    .from(creativeVersions)
    .where(eq(creativeVersions.projectId, projectId))
    .orderBy(desc(creativeVersions.version))
    .limit(1);
  return (latest?.version ?? 0) + 1;
}

export async function insertCreativeVersion(
  db: Db,
  input: { projectId: string; concept: CreativeConcept },
) {
  const now = new Date();
  const id = newId();
  const version = await nextCreativeVersion(db, input.projectId);
  await db.insert(creativeVersions).values({
    id,
    projectId: input.projectId,
    version,
    hook: input.concept.hook,
    strategy: input.concept.strategy,
    spokenScript: input.concept.spokenScript,
    draftScript: input.concept.spokenScript,
    approvedScript: null,
    scriptVersion: null,
    scenesJson: JSON.stringify(input.concept.scenes),
    callToAction: input.concept.callToAction,
    seedancePrompt: input.concept.generationPrompt,
    approvedAt: null,
    approvedBy: null,
    createdAt: now,
  });
  await db
    .update(projects)
    .set({
      currentCreativeVersionId: id,
      status: "AWAITING_APPROVAL",
      updatedAt: now,
    })
    .where(eq(projects.id, input.projectId));
  const [row] = await db.select().from(creativeVersions).where(eq(creativeVersions.id, id)).limit(1);
  if (!row) {
    throw new Error("We couldn't save that concept.");
  }
  return row;
}
