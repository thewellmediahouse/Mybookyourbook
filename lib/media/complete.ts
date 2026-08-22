import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { assertLibraryObjectKey, type LibraryRole } from "@/lib/r2/keys";

export async function completeLibraryAsset(
  db: Db,
  input: {
    workspaceId: string;
    businessId: string;
    ownerUserId: string;
    role: LibraryRole;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
  },
) {
  assertLibraryObjectKey(input.objectKey, input.workspaceId, input.businessId, input.role);

  const [existingKey] = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.r2ObjectKey, input.objectKey), isNull(assets.deletedAt)))
    .limit(1);
  if (existingKey) {
    return { assetId: existingKey.id };
  }

  const now = new Date();
  const assetId = newId();
  await db.insert(assets).values({
    id: assetId,
    workspaceId: input.workspaceId,
    ownerUserId: input.ownerUserId,
    businessId: input.businessId,
    category: "library",
    role: input.role,
    r2ObjectKey: input.objectKey,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  return { assetId };
}
