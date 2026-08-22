import { and, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, identityAssets, presenterIdentities } from "@/lib/db/schema";
import type { IdentityRole } from "@/lib/r2/keys";
import { PHOTO_SLOTS } from "./slots";

export async function listIdentityCleanupKeys(
  db: Db,
  identityId: string,
  roles?: IdentityRole[],
) {
  const filters = [eq(identityAssets.identityId, identityId), isNull(assets.deletedAt)];
  const rows = await db
    .select({
      linkId: identityAssets.id,
      assetId: assets.id,
      objectKey: assets.r2ObjectKey,
      role: identityAssets.role,
    })
    .from(identityAssets)
    .innerJoin(assets, eq(identityAssets.assetId, assets.id))
    .where(
      roles && roles.length > 0
        ? and(...filters, inArray(identityAssets.role, roles))
        : and(...filters),
    );
  return rows;
}

export async function markIdentityAssetsDeleted(db: Db, rows: { linkId: string; assetId: string }[]) {
  const now = new Date();
  for (const row of rows) {
    await db
      .update(assets)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(assets.id, row.assetId));
    await db.delete(identityAssets).where(eq(identityAssets.id, row.linkId));
  }
}

export async function refreshIdentityStatus(db: Db, identityId: string) {
  const remaining = await db
    .select({ role: identityAssets.role })
    .from(identityAssets)
    .innerJoin(assets, eq(identityAssets.assetId, assets.id))
    .where(and(eq(identityAssets.identityId, identityId), isNull(assets.deletedAt)));
  const now = new Date();
  await db
    .update(presenterIdentities)
    .set({
      status: remaining.length === 4 ? "complete" : "incomplete",
      updatedAt: now,
    })
    .where(eq(presenterIdentities.id, identityId));
}

export async function scheduleIdentityDelete(
  db: Db,
  identityId: string,
  scope: "all" | "photos" | "video",
) {
  const roles =
    scope === "photos" ? PHOTO_SLOTS : scope === "video" ? (["IDENTITY_VIDEO"] as IdentityRole[]) : undefined;
  const rows = await listIdentityCleanupKeys(db, identityId, roles);
  await markIdentityAssetsDeleted(db, rows);
  await refreshIdentityStatus(db, identityId);
  return rows.map((row) => row.objectKey);
}
