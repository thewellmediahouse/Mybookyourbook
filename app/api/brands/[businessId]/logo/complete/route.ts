import { NextResponse } from "next/server";
import { requireBrandEditor } from "@/lib/api/auth";
import { fromCaught, jsonError } from "@/lib/api/http";
import { completeLogoAsset } from "@/lib/businesses/logo";
import { getDb } from "@/lib/db/client";
import { getMediaBucket, headWorkspaceObject } from "@/lib/r2/bucket";
import { assertLogoObjectKey } from "@/lib/r2/keys";
import { LOGO_FORMAT_ERROR, LOGO_MAX_BYTES, normalizeLogoMime } from "@/lib/r2/mime";
import { queueObjectCleanups } from "@/lib/security/cleanup";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await context.params;
    const editor = await requireBrandEditor(businessId);
    const body = (await request.json()) as {
      objectKey?: string;
      mimeType?: string;
      sizeBytes?: number;
    };
    const mimeType = normalizeLogoMime(String(body.mimeType ?? ""));
    const objectKey = String(body.objectKey ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);
    if (!mimeType) {
      return jsonError(LOGO_FORMAT_ERROR, 400);
    }
    assertLogoObjectKey(objectKey, editor.workspace.id, businessId);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > LOGO_MAX_BYTES) {
      return jsonError("That logo is too large. Keep it under 5 MB.", 400);
    }
    const bucket = await getMediaBucket();
    const stored = await headWorkspaceObject(bucket, editor.workspace.id, objectKey);
    if (!stored) {
      return jsonError("We could not find that upload. Try again.", 400);
    }
    const db = await getDb();
    const completed = await completeLogoAsset(db, {
      workspaceId: editor.workspace.id,
      businessId,
      ownerUserId: editor.userId,
      objectKey,
      mimeType,
      sizeBytes: stored.size ?? sizeBytes,
    });
    if (completed.previousKeys) {
      await queueObjectCleanups(editor.workspace.id, completed.previousKeys);
    }
    return NextResponse.json({ ok: true, assetId: completed.assetId });
  } catch (error) {
    return fromCaught(error);
  }
}
