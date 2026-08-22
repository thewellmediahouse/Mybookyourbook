import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireOwnedAsset } from "@/lib/api/auth";
import { jsonError } from "@/lib/api/http";
import { getDb } from "@/lib/db/client";
import { businesses, projects } from "@/lib/db/schema";
import { assetStreamHeaders, finalCommercialFilename } from "@/lib/production/filename";
import { getMediaBucket, getWorkspaceObject } from "@/lib/r2/bucket";

export async function streamPrivateAsset(assetId: string, request?: Request) {
  const access = await requireOwnedAsset(assetId);
  if (access.asset.deletedAt) {
    return jsonError("Not found.", 404);
  }
  const object = await getWorkspaceObject(
    await getMediaBucket(),
    access.workspace.id,
    access.asset.r2ObjectKey,
  );
  if (!object) {
    return jsonError("Not found.", 404);
  }
  const download = Boolean(request && new URL(request.url).searchParams.get("download") === "1");
  return new NextResponse(object.body, {
    headers: assetStreamHeaders({
      mimeType: access.asset.mimeType,
      sizeBytes: access.asset.sizeBytes,
      download,
      filename: download ? await downloadFilenameForAsset(access.asset) : undefined,
    }),
  });
}

async function downloadFilenameForAsset(asset: {
  category: string;
  role: string;
  projectId: string | null;
  mimeType: string;
}) {
  if (asset.projectId && (asset.category === "final" || asset.role === "master")) {
    const db = await getDb();
    const [row] = await db
      .select({ title: projects.title, businessName: businesses.name })
      .from(projects)
      .innerJoin(businesses, eq(projects.businessId, businesses.id))
      .where(eq(projects.id, asset.projectId))
      .limit(1);
    if (row) {
      return finalCommercialFilename({
        category: asset.category,
        role: asset.role,
        businessName: row.businessName,
        campaignTitle: row.title,
        mimeType: asset.mimeType,
      });
    }
  }
  return finalCommercialFilename({
    category: asset.category,
    role: asset.role,
    mimeType: asset.mimeType,
  });
}
