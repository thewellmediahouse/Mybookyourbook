import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, projectReferences } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { CONTEXT_REFERENCE_LIMIT, nextContextSlot } from "./brief";
import { assertProjectReferenceObjectKey } from "@/lib/r2/keys";

export async function listProjectReferenceSlots(db: Db, projectId: string) {
  const rows = await db
    .select({
      id: projectReferences.id,
      assetId: projectReferences.assetId,
      mappingSlot: projectReferences.mappingSlot,
      category: assets.category,
      r2ObjectKey: assets.r2ObjectKey,
    })
    .from(projectReferences)
    .innerJoin(assets, eq(projectReferences.assetId, assets.id))
    .where(and(eq(projectReferences.projectId, projectId), isNull(assets.deletedAt)));
  return rows;
}

export async function attachProjectReference(
  db: Db,
  input: { projectId: string; assetId: string; workspaceId: string },
) {
  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, input.assetId), isNull(assets.deletedAt)))
    .limit(1);
  if (!asset || asset.workspaceId !== input.workspaceId) {
    throw new Error("That file does not belong to this studio.");
  }
  if (asset.category === "identity") {
    throw new Error("Identity files stay private and cannot be added to a commercial brief.");
  }
  const existing = await listProjectReferenceSlots(db, input.projectId);
  if (existing.some((row) => row.assetId === input.assetId)) {
    return { referenceId: existing.find((row) => row.assetId === input.assetId)?.id ?? "" };
  }
  if (existing.length >= CONTEXT_REFERENCE_LIMIT) {
    throw new Error("You can add up to 6 extra photos for this campaign.");
  }
  const slot = nextContextSlot(existing.map((row) => row.mappingSlot));
  if (!slot) {
    throw new Error("You can add up to 6 extra photos for this campaign.");
  }
  const id = newId();
  await db.insert(projectReferences).values({
    id,
    projectId: input.projectId,
    assetId: input.assetId,
    mappingSlot: slot,
    createdAt: new Date(),
  });
  return { referenceId: id };
}

export async function detachProjectReference(
  db: Db,
  input: { projectId: string; referenceId: string },
) {
  const [row] = await db
    .select({
      id: projectReferences.id,
      assetId: assets.id,
      category: assets.category,
      objectKey: assets.r2ObjectKey,
    })
    .from(projectReferences)
    .innerJoin(assets, eq(projectReferences.assetId, assets.id))
    .where(and(eq(projectReferences.id, input.referenceId), eq(projectReferences.projectId, input.projectId)))
    .limit(1);
  if (!row) {
    throw new Error("That reference is not on this commercial.");
  }
  await db.delete(projectReferences).where(eq(projectReferences.id, row.id));
  if (row.category === "project") {
    const now = new Date();
    await db
      .update(assets)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(assets.id, row.assetId));
    return { objectKey: row.objectKey };
  }
  return { objectKey: null };
}

export async function completeProjectReferenceAsset(
  db: Db,
  input: {
    workspaceId: string;
    projectId: string;
    businessId: string;
    ownerUserId: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
  },
) {
  assertProjectReferenceObjectKey(input.objectKey, input.workspaceId, input.projectId);
  const existing = await listProjectReferenceSlots(db, input.projectId);
  if (existing.length >= CONTEXT_REFERENCE_LIMIT) {
    throw new Error("You can add up to 6 extra photos for this campaign.");
  }
  const slot = nextContextSlot(existing.map((row) => row.mappingSlot));
  if (!slot) {
    throw new Error("You can add up to 6 extra photos for this campaign.");
  }
  const now = new Date();
  const assetId = newId();
  await db.insert(assets).values({
    id: assetId,
    workspaceId: input.workspaceId,
    ownerUserId: input.ownerUserId,
    businessId: input.businessId,
    projectId: input.projectId,
    category: "project",
    role: "reference",
    r2ObjectKey: input.objectKey,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(projectReferences).values({
    id: newId(),
    projectId: input.projectId,
    assetId,
    mappingSlot: slot,
    createdAt: now,
  });
  return { assetId, mappingSlot: slot };
}
