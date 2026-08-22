import type { Db } from "@/lib/db/client";
import { buildSeedancePrompt } from "@/lib/providers/video/seedance/prompt-builder";
import { CONTEXT_SLOTS } from "@/lib/projects/brief";
import { listProjectReferenceSlots } from "@/lib/projects/references";
import { parseScenesJson } from "./public";

export async function buildApprovedFilmingPrompt(
  db: Db,
  input: {
    projectId: string;
    approvedScript: string;
    scenesJson: string | null;
    aspectRatio: string;
    durationSeconds: number;
    style: string;
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
  });
}
