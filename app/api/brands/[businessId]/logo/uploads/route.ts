import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireBrandEditor } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { newId } from "@/lib/id";
import { logoObjectKey } from "@/lib/r2/keys";
import { LOGO_MAX_BYTES, normalizeLogoMime } from "@/lib/r2/mime";
import { planLogoUpload } from "@/lib/r2/plan";
import { assertRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ businessId: string }> },
) {
  try {
    const { businessId } = await context.params;
    const editor = await requireBrandEditor(businessId);
    await assertRateLimit(await getDb(), "upload", editor.workspace.id);
    const body = (await request.json()) as { mimeType?: string; sizeBytes?: number };
    const mimeType = normalizeLogoMime(String(body.mimeType ?? ""));
    const sizeBytes = Number(body.sizeBytes ?? 0);
    if (!mimeType) {
      return jsonError("Use a PNG, JPEG, WebP, or SVG logo.", 400);
    }
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > LOGO_MAX_BYTES) {
      return jsonError("That logo is too large. Keep it under 5 MB.", 400);
    }
    const objectId = newId();
    const objectKey = logoObjectKey(editor.workspace.id, businessId, objectId);
    const plan = await planLogoUpload({
      objectKey,
      mimeType,
      bindingPutUrl: `/api/brands/${businessId}/logo/objects/${objectId}`,
    });
    return NextResponse.json({ objectKey, mimeType, sizeBytes, upload: plan });
  } catch (error) {
    return fromCaught(error);
  }
}
