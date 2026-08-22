import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireStudioIdentity } from "@/lib/api/identity";
import { requireCurrentConsent } from "@/lib/identity/consent";
import { PHOTO_MAX_BYTES, VIDEO_MAX_BYTES } from "@/lib/identity/copy";
import { normalizeIdentityPhotoMime, normalizeIdentityVideoMime } from "@/lib/identity/mime";
import { parseIdentitySlot, slotPath } from "@/lib/identity/slots";
import { newId } from "@/lib/id";
import { identityObjectKey } from "@/lib/r2/keys";
import { planObjectUpload } from "@/lib/r2/plan";
import { assertRateLimit } from "@/lib/security/rate-limit";

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
    await assertRateLimit(ctx.db, "upload", ctx.workspaceId);
    await requireCurrentConsent(ctx.db, ctx.identity.id, ctx.userId);
    const body = (await request.json()) as { mimeType?: string; sizeBytes?: number };
    const mimeType =
      role === "IDENTITY_VIDEO"
        ? normalizeIdentityVideoMime(String(body.mimeType ?? ""))
        : normalizeIdentityPhotoMime(String(body.mimeType ?? ""));
    const sizeBytes = Number(body.sizeBytes ?? 0);
    const max = role === "IDENTITY_VIDEO" ? VIDEO_MAX_BYTES : PHOTO_MAX_BYTES;
    if (!mimeType) {
      return jsonError(
        role === "IDENTITY_VIDEO"
          ? "Use a common phone video format such as MP4 or WebM."
          : "Use a PNG, JPEG, or WebP photo.",
        400,
      );
    }
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > max) {
      return jsonError(
        role === "IDENTITY_VIDEO"
          ? "That video is too large. Keep it under 40 MB."
          : "That photo is too large. Keep it under 8 MB.",
        400,
      );
    }
    const objectId = newId();
    const objectKey = identityObjectKey(ctx.workspaceId, ctx.userId, role, objectId);
    const plan = await planObjectUpload({
      objectKey,
      mimeType,
      bindingPutUrl: `/api/identity/${slotPath(role)}/objects/${objectId}`,
    });
    return NextResponse.json({ objectKey, mimeType, sizeBytes, role, upload: plan });
  } catch (error) {
    return fromCaught(error);
  }
}
