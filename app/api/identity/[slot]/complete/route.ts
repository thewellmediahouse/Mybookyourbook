import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireStudioIdentity } from "@/lib/api/identity";
import { completeIdentityAsset } from "@/lib/identity/complete";
import { PHOTO_MAX_BYTES, VIDEO_MAX_BYTES, VIDEO_MAX_SECONDS, VIDEO_MIN_SECONDS } from "@/lib/identity/copy";
import { normalizeIdentityPhotoMime, normalizeIdentityVideoMime } from "@/lib/identity/mime";
import { parseIdentitySlot } from "@/lib/identity/slots";
import { getMediaBucket, headWorkspaceObject } from "@/lib/r2/bucket";
import { assertIdentityObjectKey } from "@/lib/r2/keys";
import { queueObjectCleanups } from "@/lib/security/cleanup";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ slot: string }> },
) {
  try {
    const { slot: rawSlot } = await context.params;
    const role = parseIdentitySlot(rawSlot);
    if (!role) {
      return jsonError("That identity file type is not supported.", 400);
    }
    const ctx = await requireStudioIdentity();
    const body = (await request.json()) as {
      objectKey?: string;
      mimeType?: string;
      sizeBytes?: number;
      durationSeconds?: number;
    };
    const mimeType =
      role === "IDENTITY_VIDEO"
        ? normalizeIdentityVideoMime(String(body.mimeType ?? ""))
        : normalizeIdentityPhotoMime(String(body.mimeType ?? ""));
    const objectKey = String(body.objectKey ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);
    const max = role === "IDENTITY_VIDEO" ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES;
    if (!mimeType) {
      return jsonError("That file type is not allowed.", 400);
    }
    assertIdentityObjectKey(objectKey, ctx.workspaceId, ctx.userId, role);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > max) {
      return jsonError("That file is too large.", 400);
    }
    if (role === "IDENTITY_VIDEO") {
      const duration = Number(body.durationSeconds ?? 0);
      if (duration < VIDEO_MIN_SECONDS || duration > VIDEO_MAX_SECONDS) {
        return jsonError("The reference video must be about 8 to 15 seconds.", 400);
      }
    }
    const bucket = await getMediaBucket();
    const stored = await headWorkspaceObject(bucket, ctx.workspaceId, objectKey);
    if (!stored) {
      return jsonError("We could not find that upload. Try again.", 400);
    }
    const completed = await completeIdentityAsset(ctx.db, {
      workspaceId: ctx.workspaceId,
      userId: ctx.userId,
      identityId: ctx.identity.id,
      role,
      objectKey,
      mimeType,
      sizeBytes: stored.size ?? sizeBytes,
      durationSeconds: role === "IDENTITY_VIDEO" ? Number(body.durationSeconds) : null,
    });
    await queueObjectCleanups(ctx.workspaceId, completed.previousKeys);
    return NextResponse.json({ ok: true, assetId: completed.assetId });
  } catch (error) {
    return fromCaught(error);
  }
}
