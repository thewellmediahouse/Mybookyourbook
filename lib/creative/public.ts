import type { ConceptScene, PublicCreativeConcept } from "@/lib/ai/creative-director";
import type { creativeVersions } from "@/lib/db/schema";

type CreativeRow = typeof creativeVersions.$inferSelect;

export function parseScenesJson(value: string | null): ConceptScene[] {
  if (!value) {
    return [];
  }
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is ConceptScene => {
      if (!item || typeof item !== "object") {
        return false;
      }
      const scene = item as ConceptScene;
      return (
        typeof scene.startSecond === "number" &&
        typeof scene.endSecond === "number" &&
        typeof scene.visual === "string" &&
        typeof scene.camera === "string"
      );
    });
  } catch {
    return [];
  }
}

export function toPublicConcept(row: CreativeRow): PublicCreativeConcept {
  return {
    versionId: row.id,
    version: row.version,
    approved: Boolean(row.approvedAt),
    title: row.hook ?? "",
    hook: row.hook ?? "",
    strategy: row.strategy ?? "",
    spokenScript: row.spokenScript ?? "",
    scenes: parseScenesJson(row.scenesJson),
    callToAction: row.callToAction ?? "",
  };
}

export function formatSceneRange(startSecond: number, endSecond: number): string {
  return `${startSecond}–${endSecond}`;
}
