import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { fromAdminCaught, jsonError } from "@/lib/api/http";
import { requireAdminApi } from "@/lib/admin/access";
import { getDb } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";
import { getMediaBucket, getWorkspaceObject } from "@/lib/r2/bucket";
import { assetStreamHeaders } from "@/lib/production/filename";

export const dynamic = "force-dynamic";

export async function GET(request: Request, context: { params: Promise<{ assetId: string }> }) {
  try {
    await requireAdminApi();
    const { assetId } = await context.params;
    const db = await getDb();
    const [asset] = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
    if (!asset) {
      return jsonError("Not found.", 404);
    }
    const object = await getWorkspaceObject(await getMediaBucket(), asset.workspaceId, asset.r2ObjectKey);
    if (!object) {
      return jsonError("Not found.", 404);
    }
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new NextResponse(object.body, {
      headers: assetStreamHeaders({
        mimeType: asset.mimeType,
        sizeBytes: asset.sizeBytes,
        download,
        filename: download ? "production30-staff-download.mp4" : undefined,
      }),
    });
  } catch (error) {
    return fromAdminCaught(error);
  }
}
