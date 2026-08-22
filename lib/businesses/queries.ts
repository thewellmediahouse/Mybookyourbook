import { and, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, brandAssets, businesses } from "@/lib/db/schema";

export const ACTIVE_BRAND_COOKIE = "production30_brand";

export type BrandRecord = typeof businesses.$inferSelect;

export type BrandWithLogo = BrandRecord & {
  logoAssetId: string | null;
  logoMimeType: string | null;
};

export function resolveActiveBrand(
  brands: { id: string }[],
  preferredId: string | undefined,
): string | null {
  if (brands.length === 0) {
    return null;
  }
  if (preferredId && brands.some((brand) => brand.id === preferredId)) {
    return preferredId;
  }
  return brands[0]?.id ?? null;
}

export async function getBrand(db: Db, businessId: string): Promise<BrandRecord | null> {
  const [row] = await db.select().from(businesses).where(eq(businesses.id, businessId)).limit(1);
  return row ?? null;
}

export async function getBrandLogoAsset(db: Db, businessId: string) {
  const [row] = await db
    .select({
      assetId: assets.id,
      mimeType: assets.mimeType,
      r2ObjectKey: assets.r2ObjectKey,
    })
    .from(brandAssets)
    .innerJoin(assets, eq(brandAssets.assetId, assets.id))
    .where(
      and(eq(brandAssets.businessId, businessId), eq(brandAssets.role, "logo"), isNull(assets.deletedAt)),
    )
    .limit(1);
  return row ?? null;
}

export async function getBrandWithLogo(db: Db, businessId: string): Promise<BrandWithLogo | null> {
  const brand = await getBrand(db, businessId);
  if (!brand) {
    return null;
  }
  const logo = await getBrandLogoAsset(db, businessId);
  return {
    ...brand,
    logoAssetId: logo?.assetId ?? null,
    logoMimeType: logo?.mimeType ?? null,
  };
}
