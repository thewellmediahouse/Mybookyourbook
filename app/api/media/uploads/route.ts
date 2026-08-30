import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireStudioLibraryWrite } from "@/lib/api/media";
import { newId } from "@/lib/id";
import { libraryFormatError, libraryMaxBytes, libraryTooLargeMessage, normalizeLibraryMime } from "@/lib/media/mime";
import { parseLibraryRole } from "@/lib/media/slots";
import { libraryObjectKey } from "@/lib/r2/keys";
import { planObjectUpload } from "@/lib/r2/plan";
import { assertRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ctx = await requireStudioLibraryWrite();
    await assertRateLimit(ctx.db, "upload", ctx.workspaceId);
    const body = (await request.json()) as {
      mimeType?: string;
      sizeBytes?: number;
      role?: string;
    };
    const role = parseLibraryRole(String(body.role ?? ""));
    if (!role) {
      return jsonError("That library folder is not supported.", 400);
    }
    const mimeType = normalizeLibraryMime(String(body.mimeType ?? ""), role);
    const sizeBytes = Number(body.sizeBytes ?? 0);
    if (!mimeType) {
      return jsonError(libraryFormatError(role), 400);
    }
    const max = libraryMaxBytes(mimeType);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > max) {
      return jsonError(libraryTooLargeMessage(mimeType), 400);
    }
    const objectId = newId();
    const objectKey = libraryObjectKey(ctx.workspaceId, ctx.businessId, role, objectId);
    const plan = await planObjectUpload({
      objectKey,
      mimeType,
      bindingPutUrl: `/api/media/objects/${objectId}?role=${role}`,
    });
    return NextResponse.json({ objectKey, mimeType, sizeBytes, role, upload: plan });
  } catch (error) {
    return fromCaught(error);
  }
}
