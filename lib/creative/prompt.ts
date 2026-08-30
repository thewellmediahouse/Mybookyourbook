import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { getBrandLogoAsset } from "@/lib/businesses/queries";
import { creativeVersions } from "@/lib/db/schema";
import { ensureFilmingTextBan } from "@/lib/creative/on-screen-text";
import { isReapiReferenceImageMime } from "@/lib/providers/video/seedance";
import { buildSeedancePrompt } from "@/lib/providers/video/seedance/prompt-builder";
import { CONTEXT_SLOTS } from "@/lib/projects/brief";
import { getProjectBrief } from "@/lib/projects/queries";
import { listProjectReferenceSlots } from "@/lib/projects/references";
import { parseScenesJson } from "./public";

export async function filmingIncludeLogo(db: Db, businessId: string): Promise<boolean> {
  const logo = await getBrandLogoAsset(db, businessId);
  return isReapiReferenceImageMime(logo?.mimeType);
}

export async function buildApprovedFilmingPrompt(
  db: Db,
  input: {
    projectId: string;
    approvedScript: string;
    scenesJson: string | null;
    aspectRatio: string;
    durationSeconds: number;
    style: string;
    includeLogo?: boolean;
  },
) {
  const refs = await listProjectReferenceSlots(db, input.projectId);
  const contextSlots = CONTEXT_SLOTS.filter((slot) =>
    refs.some((row) => row.mappingSlot === slot),
  );
  return buildSeedancePrompt({
    approvedScript: input.approvedScript,
    scenes: parseScenesJson(input.scenesJson),
    aspectRatio: input.aspectRatio,
    durationSeconds: input.durationSeconds,
    style: input.style,
    contextSlots: [...contextSlots],
    includeLogo: input.includeLogo,
  });
}

/** Rebuild with the current no-writing rules so older approved concepts cannot film small text. */
export async function resolveFilmingPrompt(
  db: Db,
  input: { projectId: string; creativeVersionId: string },
): Promise<string> {
  const [version] = await db
    .select({
      approvedScript: creativeVersions.approvedScript,
      spokenScript: creativeVersions.spokenScript,
      scenesJson: creativeVersions.scenesJson,
      seedancePrompt: creativeVersions.seedancePrompt,
    })
    .from(creativeVersions)
    .where(eq(creativeVersions.id, input.creativeVersionId))
    .limit(1);
  const stored = version?.seedancePrompt?.trim() ?? "";
  const approvedScript = version?.approvedScript?.trim() || version?.spokenScript?.trim() || "";
  const brief = await getProjectBrief(db, input.projectId);
  if (approvedScript && brief && version?.scenesJson) {
    try {
      return await buildApprovedFilmingPrompt(db, {
        projectId: input.projectId,
        approvedScript,
        scenesJson: version.scenesJson,
        aspectRatio: brief.aspectRatio,
        durationSeconds: brief.duration,
        style: brief.style,
        includeLogo: await filmingIncludeLogo(db, brief.businessId),
      });
    } catch {
      if (stored) {
        return ensureFilmingTextBan(stored);
      }
    }
  }
  if (stored) {
    return ensureFilmingTextBan(stored);
  }
  throw new Error("PROMPT_MISSING");
}
