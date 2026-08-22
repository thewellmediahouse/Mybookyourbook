import type { Db } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { assertProductionObjectKey, type ProductionAssetKind } from "@/lib/r2/keys";

export async function insertProductionAsset(
  db: Db,
  input: {
    workspaceId: string;
    userId: string;
    businessId: string;
    projectId: string;
    kind: ProductionAssetKind;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
    width?: number | null;
    height?: number | null;
    durationSeconds?: number | null;
    fps?: number | null;
    videoCodec?: string | null;
    audioCodec?: string | null;
  },
) {
  assertProductionObjectKey(input.objectKey, input.workspaceId, input.projectId, input.kind);
  const now = new Date();
  const id = newId();
  const role =
    input.kind === "source"
      ? "source"
      : input.kind === "enhanced"
        ? "enhanced"
        : input.kind === "thumbnail"
          ? "thumbnail"
          : "master";
  await db.insert(assets).values({
    id,
    workspaceId: input.workspaceId,
    ownerUserId: input.userId,
    businessId: input.businessId,
    projectId: input.projectId,
    category: input.kind === "thumbnail" ? "thumbnail" : input.kind === "final" ? "final" : "production",
    role,
    r2ObjectKey: input.objectKey,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    width: input.width ?? null,
    height: input.height ?? null,
    durationSeconds: input.durationSeconds ?? (input.kind === "thumbnail" ? null : 30),
    fps: input.fps ?? null,
    videoCodec: input.videoCodec ?? null,
    audioCodec: input.audioCodec ?? null,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}
