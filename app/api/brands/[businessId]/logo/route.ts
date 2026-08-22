import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { requireBrandEditor } from "@/lib/api/auth";
import { fromCaught } from "@/lib/api/http";
import { getDb } from "@/lib/db/client";
import { assets, brandAssets } from "@/lib/db/schema";
import { queueObjectCleanup } from "@/lib/security/cleanup";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await context.params;
    const editor = await requireBrandEditor(businessId);
    const db = await getDb();
    const rows = await db
      .select({
        brandAssetId: brandAssets.id,
        assetId: assets.id,
        objectKey: assets.r2ObjectKey,
      })
      .from(brandAssets)
      .innerJoin(assets, eq(brandAssets.assetId, assets.id))
      .where(
        and(eq(brandAssets.businessId, businessId), eq(brandAssets.role, "logo"), isNull(assets.deletedAt)),
      );
    const now = new Date();
    for (const row of rows) {
      await db
        .update(assets)
        .set({ deletedAt: now, updatedAt: now })
        .where(eq(assets.id, row.assetId));
      await db.delete(brandAssets).where(eq(brandAssets.id, row.brandAssetId));
      await queueObjectCleanup(editor.workspace.id, row.objectKey);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromCaught(error);
  }
}
