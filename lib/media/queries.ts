import { and, desc, eq, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";
import type { LibraryRole } from "@/lib/r2/keys";
import { getBrandLogoAsset } from "@/lib/businesses/queries";

export type LibraryItem = {
  id: string;
  source: "library" | "brand-logo";
  role: LibraryRole;
  mimeType: string;
  createdAt: Date;
};

export async function listLibraryAssets(
  db: Db,
  input: { workspaceId: string; businessId: string; role: LibraryRole },
): Promise<LibraryItem[]> {
  const rows = await db
    .select({
      id: assets.id,
      role: assets.role,
      mimeType: assets.mimeType,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(
      and(
        eq(assets.workspaceId, input.workspaceId),
        eq(assets.businessId, input.businessId),
        eq(assets.category, "library"),
        eq(assets.role, input.role),
        isNull(assets.deletedAt),
      ),
    )
    .orderBy(desc(assets.createdAt));

  const items: LibraryItem[] = rows.map((row) => ({
    id: row.id,
    source: "library",
    role: input.role,
    mimeType: row.mimeType,
    createdAt: row.createdAt,
  }));

  if (input.role === "logo") {
    const brandLogo = await getBrandLogoAsset(db, input.businessId);
    if (brandLogo) {
      const [meta] = await db
        .select({ createdAt: assets.createdAt, mimeType: assets.mimeType })
        .from(assets)
        .where(and(eq(assets.id, brandLogo.assetId), isNull(assets.deletedAt)))
        .limit(1);
      if (meta) {
        items.unshift({
          id: brandLogo.assetId,
          source: "brand-logo",
          role: "logo",
          mimeType: meta.mimeType,
          createdAt: meta.createdAt,
        });
      }
    }
  }

  return items;
}

export async function listReusableLibraryAssets(
  db: Db,
  input: { workspaceId: string; businessId: string },
) {
  return db
    .select({
      id: assets.id,
      role: assets.role,
      mimeType: assets.mimeType,
    })
    .from(assets)
    .where(
      and(
        eq(assets.workspaceId, input.workspaceId),
        eq(assets.businessId, input.businessId),
        eq(assets.category, "library"),
        isNull(assets.deletedAt),
      ),
    )
    .orderBy(desc(assets.createdAt))
    .limit(24);
}
