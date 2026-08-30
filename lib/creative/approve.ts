import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { creativeVersions, projects } from "@/lib/db/schema";
import { getProjectBrief } from "@/lib/projects/queries";
import { buildApprovedFilmingPrompt, filmingIncludeLogo } from "./prompt";
import { getCreativeVersion, getLatestCreativeVersion } from "./queries";
import { toPublicConcept } from "./public";

export async function approveConcept(
  db: Db,
  input: { projectId: string; workspaceId: string; userId: string; versionId?: string },
) {
  const brief = await getProjectBrief(db, input.projectId);
  if (!brief || brief.workspaceId !== input.workspaceId) {
    throw new Error("You do not have access to that commercial.");
  }
  const row = input.versionId
    ? await getCreativeVersion(db, input.projectId, input.versionId)
    : await getLatestCreativeVersion(db, input.projectId);
  if (!row) {
    throw new Error("Create a concept before you approve it.");
  }
  const now = new Date();
  if (!row.approvedAt) {
    const approvedScript = row.spokenScript?.trim() || "";
    const seedancePrompt = await buildApprovedFilmingPrompt(db, {
      projectId: input.projectId,
      approvedScript,
      scenesJson: row.scenesJson,
      aspectRatio: brief.aspectRatio,
      durationSeconds: brief.duration,
      style: brief.style,
      includeLogo: await filmingIncludeLogo(db, brief.businessId),
    });
    await db
      .update(creativeVersions)
      .set({
        approvedAt: now,
        approvedBy: input.userId,
        approvedScript,
        scriptVersion: row.version,
        seedancePrompt,
      })
      .where(eq(creativeVersions.id, row.id));
  }
  await db
    .update(projects)
    .set({
      currentCreativeVersionId: row.id,
      status: "READY_TO_PRODUCE",
      updatedAt: now,
    })
    .where(eq(projects.id, input.projectId));
  const approved = await getCreativeVersion(db, input.projectId, row.id);
  if (!approved) {
    throw new Error("We couldn't approve that concept.");
  }
  return toPublicConcept(approved);
}
