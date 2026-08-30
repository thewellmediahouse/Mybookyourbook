import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, identityAssets, presenterIdentities } from "@/lib/db/schema";
import { hasCurrentConsent } from "./consent";
import { IDENTITY_SLOTS } from "./slots";
import type { IdentityRole } from "@/lib/r2/keys";

export type IdentityAssetView = {
  role: IdentityRole;
  assetId: string;
  mimeType: string;
  durationSeconds: number | null;
};

export type IdentityBundle = {
  identityId: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  consented: boolean;
  assets: Partial<Record<IdentityRole, IdentityAssetView>>;
};

export function identitySlotsFilled(
  assets: Partial<Record<IdentityRole, { assetId: string } | null | undefined>> | null | undefined,
): boolean {
  return IDENTITY_SLOTS.every((slot) => Boolean(assets?.[slot]?.assetId));
}

export function isReferenceProfileReady(bundle: IdentityBundle | null): boolean {
  if (!bundle?.consented) {
    return false;
  }
  return identitySlotsFilled(bundle.assets);
}

export async function getIdentityBundle(
  db: Db,
  workspaceId: string,
  userId: string,
): Promise<IdentityBundle | null> {
  const [identity] = await db
    .select()
    .from(presenterIdentities)
    .where(and(eq(presenterIdentities.workspaceId, workspaceId), eq(presenterIdentities.userId, userId)))
    .limit(1);
  if (!identity) {
    return null;
  }
  const rows = await db
    .select({
      role: identityAssets.role,
      assetId: assets.id,
      mimeType: assets.mimeType,
      durationSeconds: assets.durationSeconds,
    })
    .from(identityAssets)
    .innerJoin(assets, eq(identityAssets.assetId, assets.id))
    .where(and(eq(identityAssets.identityId, identity.id), isNull(assets.deletedAt)));

  const mapped: IdentityBundle["assets"] = {};
  for (const row of rows) {
    mapped[row.role] = {
      role: row.role,
      assetId: row.assetId,
      mimeType: row.mimeType,
      durationSeconds: row.durationSeconds,
    };
  }

  return {
    identityId: identity.id,
    status: identity.status,
    createdAt: identity.createdAt,
    updatedAt: identity.updatedAt,
    consented: await hasCurrentConsent(db, identity.id, userId),
    assets: mapped,
  };
}

export async function countCurrentIdentitySlots(db: Db, identityId: string): Promise<number> {
  const rows = await db
    .select({ role: identityAssets.role })
    .from(identityAssets)
    .innerJoin(assets, eq(identityAssets.assetId, assets.id))
    .where(and(eq(identityAssets.identityId, identityId), isNull(assets.deletedAt)));
  const unique = new Set(rows.map((row) => row.role));
  return IDENTITY_SLOTS.filter((slot) => unique.has(slot)).length;
}
