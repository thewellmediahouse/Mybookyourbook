import { eq } from "drizzle-orm";
import type { ConceptScene } from "@/lib/ai/creative-director";
import type { Db } from "@/lib/db/client";
import { creativeVersions, projects } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { getProjectBrief } from "@/lib/projects/queries";
import { nextCreativeVersion } from "./persist";
import { getLatestCreativeVersion } from "./queries";
import { toPublicConcept } from "./public";

export type ConceptEdits = {
  hook?: string;
  strategy?: string;
  spokenScript?: string;
  scenes?: ConceptScene[];
  callToAction?: string;
};

export async function editConcept(
  db: Db,
  input: { projectId: string; workspaceId: string; patch: ConceptEdits },
) {
  const brief = await getProjectBrief(db, input.projectId);
  if (!brief || brief.workspaceId !== input.workspaceId) {
    throw new Error("You do not have access to that commercial.");
  }
  const latest = await getLatestCreativeVersion(db, input.projectId);
  if (!latest) {
    throw new Error("Create a concept before you edit it.");
  }
  const hook = input.patch.hook?.trim() || latest.hook;
  const strategy = input.patch.strategy?.trim() || latest.strategy;
  const spokenScript = input.patch.spokenScript?.trim() || latest.spokenScript;
  const callToAction = input.patch.callToAction?.trim() || latest.callToAction;
  const scenesJson = input.patch.scenes
    ? JSON.stringify(input.patch.scenes)
    : latest.scenesJson;
  const now = new Date();

  if (latest.approvedAt) {
    const id = newId();
    const version = await nextCreativeVersion(db, input.projectId);
    await db.insert(creativeVersions).values({
      id,
      projectId: input.projectId,
      version,
      hook,
      strategy,
      spokenScript,
      draftScript: spokenScript,
      approvedScript: null,
      scriptVersion: null,
      scenesJson,
      callToAction,
      seedancePrompt: latest.seedancePrompt,
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
      throw new Error("We couldn't save those changes.");
    }
    return toPublicConcept(row);
  }

  await db
    .update(creativeVersions)
    .set({
      hook,
      strategy,
      spokenScript,
      draftScript: spokenScript,
      scenesJson,
      callToAction,
    })
    .where(eq(creativeVersions.id, latest.id));
  await db.update(projects).set({ updatedAt: now }).where(eq(projects.id, input.projectId));
  const [row] = await db
    .select()
    .from(creativeVersions)
    .where(eq(creativeVersions.id, latest.id))
    .limit(1);
  if (!row) {
    throw new Error("We couldn't save those changes.");
  }
  return toPublicConcept(row);
}
