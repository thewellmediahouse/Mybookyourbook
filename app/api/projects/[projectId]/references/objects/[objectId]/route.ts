import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireProjectEditor } from "@/lib/api/projects";
import { LIBRARY_MAX_BYTES, normalizeLibraryMime } from "@/lib/media/mime";
import { getMediaBucket, putWorkspaceObject } from "@/lib/r2/bucket";
import { projectReferenceObjectKey } from "@/lib/r2/keys";
import { assertAllowedUploadBytes } from "@/lib/r2/sniff";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ projectId: string; objectId: string }> },
) {
  try {
    const { projectId, objectId } = await context.params;
    const ctx = await requireProjectEditor(projectId);
    const mimeType = normalizeLibraryMime(request.headers.get("content-type") ?? "", "campaign");
    if (!mimeType) {
      return jsonError("Use a PNG, JPEG, or WebP photo.", 400);
    }
    const body = await request.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > LIBRARY_MAX_BYTES) {
      return jsonError("That photo is too large. Keep it under 8 MB.", 400);
    }
    assertAllowedUploadBytes(new Uint8Array(body), mimeType);
    const objectKey = projectReferenceObjectKey(ctx.workspaceId, projectId, objectId);
    await putWorkspaceObject(await getMediaBucket(), {
      workspaceId: ctx.workspaceId,
      objectKey,
      body,
      mimeType,
    });
    return NextResponse.json({ ok: true, sizeBytes: body.byteLength });
  } catch (error) {
    return fromCaught(error);
  }
}
