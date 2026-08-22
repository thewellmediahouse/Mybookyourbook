import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireBrandEditor } from "@/lib/api/auth";
import { getMediaBucket, putWorkspaceObject } from "@/lib/r2/bucket";
import { logoObjectKey } from "@/lib/r2/keys";
import { LOGO_MAX_BYTES, normalizeLogoMime } from "@/lib/r2/mime";
import { assertAllowedUploadBytes } from "@/lib/r2/sniff";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ businessId: string; objectId: string }> },
) {
  try {
    const { businessId, objectId } = await context.params;
    const editor = await requireBrandEditor(businessId);
    const mimeType = normalizeLogoMime(request.headers.get("content-type") ?? "");
    if (!mimeType) {
      return jsonError("Use a PNG, JPEG, WebP, or SVG logo.", 400);
    }
    const body = await request.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > LOGO_MAX_BYTES) {
      return jsonError("That logo is too large. Keep it under 5 MB.", 400);
    }
    assertAllowedUploadBytes(new Uint8Array(body), mimeType);
    const objectKey = logoObjectKey(editor.workspace.id, businessId, objectId);
    await putWorkspaceObject(await getMediaBucket(), {
      workspaceId: editor.workspace.id,
      objectKey,
      body,
      mimeType,
    });
    return NextResponse.json({ ok: true, objectKey, sizeBytes: body.byteLength });
  } catch (error) {
    return fromCaught(error);
  }
}
