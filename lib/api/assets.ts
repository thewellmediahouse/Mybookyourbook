import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  capBytesRange,
  contentRangeHeader,
  MAX_PLAYBACK_RANGE_BYTES,
  parseBytesRange,
  shouldBufferPrivateAsset,
} from "@/lib/api/byte-range";
import { requireOwnedAsset } from "@/lib/api/auth";
import { jsonError } from "@/lib/api/http";
import { getDb } from "@/lib/db/client";
import { businesses, projects } from "@/lib/db/schema";
import { assetStreamHeaders, finalCommercialFilename } from "@/lib/production/filename";
import { getMediaBucket, getWorkspaceObject, headWorkspaceObject } from "@/lib/r2/bucket";

export async function streamPrivateAsset(assetId: string, request?: Request) {
  const access = await requireOwnedAsset(assetId);
  if (access.asset.deletedAt) {
    return jsonError("Not found.", 404);
  }
  const bucket = await getMediaBucket();
  const head = await headWorkspaceObject(bucket, access.workspace.id, access.asset.r2ObjectKey);
  if (!head || head.size === 0) {
    return jsonError("Not found.", 404);
  }
  const download = Boolean(request && new URL(request.url).searchParams.get("download") === "1");
  const mimeType = head.httpMetadata?.contentType || access.asset.mimeType || "application/octet-stream";
  const filename = download ? await downloadFilenameForAsset(access.asset) : undefined;
  const requested = !download && request ? parseBytesRange(request.headers.get("Range"), head.size) : { kind: "all" as const };
  // A request with no Range must stay a full stream. Capping it to 1 MB left
  // cards with an incomplete file that the browser could not start.
  const range = download ? requested : capBytesRange(requested, head.size, MAX_PLAYBACK_RANGE_BYTES);
  if (range.kind === "unsatisfiable") {
    return new NextResponse(null, {
      status: 416,
      headers: {
        "Accept-Ranges": "bytes",
        "Content-Range": `bytes */${head.size}`,
      },
    });
  }
  if (request?.method === "HEAD" && range.kind === "all") {
    return new NextResponse(null, {
      status: 200,
      headers: assetStreamHeaders({ mimeType, sizeBytes: head.size, download, filename }),
    });
  }
  const object = await getWorkspaceObject(
    bucket,
    access.workspace.id,
    access.asset.r2ObjectKey,
    range.kind === "slice"
      ? { range: { offset: range.start, length: range.end - range.start + 1 } }
      : undefined,
  );
  if (!object) {
    return jsonError("Not found.", 404);
  }
  const slice = range.kind === "slice";
  const headers = assetStreamHeaders({
    mimeType,
    sizeBytes: slice ? range.end - range.start + 1 : head.size,
    download,
    filename,
  });
  if (slice) {
    headers["Content-Range"] = contentRangeHeader(range.start, range.end, head.size);
  }
  const status = slice ? 206 : 200;
  // OpenNext can empty a streamed image body. Stills must be buffered.
  if (shouldBufferPrivateAsset({ mimeType, download })) {
    const bytes = await object.arrayBuffer();
    if (bytes.byteLength === 0) {
      return jsonError("Not found.", 404);
    }
    headers["Content-Length"] = String(bytes.byteLength);
    return new NextResponse(bytes, { status, headers });
  }
  if (!("body" in object) || !object.body) {
    return jsonError("Not found.", 404);
  }
  return new NextResponse(object.body, {
    status,
    headers,
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
