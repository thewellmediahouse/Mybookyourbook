import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireStudioIdentity } from "@/lib/api/identity";
import { requireCurrentConsent } from "@/lib/identity/consent";
import { PHOTO_MAX_BYTES, VIDEO_MAX_BYTES } from "@/lib/identity/copy";
import { normalizeIdentityPhotoMime, normalizeIdentityVideoMime } from "@/lib/identity/mime";
import { parseIdentitySlot } from "@/lib/identity/slots";
import { getMediaBucket, putWorkspaceObject } from "@/lib/r2/bucket";
import { identityObjectKey } from "@/lib/r2/keys";
import { assertAllowedUploadBytes } from "@/lib/r2/sniff";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ slot: string; objectId: string }> },
) {
  try {
    const { slot: rawSlot, objectId } = await context.params;
    const role = parseIdentitySlot(rawSlot);
    if (!role) {
      return jsonError("That identity file type is not supported.", 400);
    }
    const ctx = await requireStudioIdentity();
    await requireCurrentConsent(ctx.db, ctx.identity.id, ctx.userId);
    const mimeType =
      role === "IDENTITY_VIDEO"
        ? normalizeIdentityVideoMime(request.headers.get("content-type") ?? "")
        : normalizeIdentityPhotoMime(request.headers.get("content-type") ?? "");
    if (!mimeType) {
      return jsonError("That file type is not allowed.", 400);
    }
    const body = await request.arrayBuffer();
    const max = role === "IDENTITY_VIDEO" ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES;
    if (body.byteLength === 0 || body.byteLength > max) {
      return jsonError("That file is too large.", 400);
    }
    assertAllowedUploadBytes(new Uint8Array(body), mimeType);
    const objectKey = identityObjectKey(ctx.workspaceId, ctx.userId, role, objectId);
    await putWorkspaceObject(await getMediaBucket(), {
      workspaceId: ctx.workspaceId,
      objectKey,
      body,
      mimeType,
    });
    return NextResponse.json({ ok: true, objectKey, sizeBytes: body.byteLength });
  } catch (error) {
    return fromCaught(error);
  }
}
