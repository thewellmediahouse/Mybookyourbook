import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, brandAssets } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { assertWorkspaceObjectKey } from "@/lib/r2/keys";

export async function completeLogoAsset(
  db: Db,
  input: {
    workspaceId: string;
    businessId: string;
    ownerUserId: string;
    objectKey: string;
    mimeType: string;
    sizeBytes: number;
  },
) {
  assertWorkspaceObjectKey(input.objectKey, input.workspaceId);

  const now = new Date();
  const existing = await db
    .select({ id: assets.id })
    .from(assets)
    .where(and(eq(assets.r2ObjectKey, input.objectKey), isNull(assets.deletedAt)))
    .limit(1);
  if (existing[0]) {
    return { assetId: existing[0].id };
  }

  const previous = await db
    .select({
      brandAssetId: brandAssets.id,
      assetId: assets.id,
      objectKey: assets.r2ObjectKey,
    })
    .from(brandAssets)
    .innerJoin(assets, eq(brandAssets.assetId, assets.id))
    .where(
      and(eq(brandAssets.businessId, input.businessId), eq(brandAssets.role, "logo"), isNull(assets.deletedAt)),
    );

  const assetId = newId();
  await db.insert(assets).values({
    id: assetId,
    workspaceId: input.workspaceId,
    ownerUserId: input.ownerUserId,
    businessId: input.businessId,
    category: "brand",
    role: "logo",
    r2ObjectKey: input.objectKey,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    status: "ready",
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(brandAssets).values({
    id: newId(),
    businessId: input.businessId,
    assetId,
    role: "logo",
    createdAt: now,
  });

  const previousKeys: string[] = [];
  for (const row of previous) {
    previousKeys.push(row.objectKey);
    await db
      .update(assets)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(assets.id, row.assetId));
    await db.delete(brandAssets).where(eq(brandAssets.id, row.brandAssetId));
  }

  return { assetId, previousKeys };
}
