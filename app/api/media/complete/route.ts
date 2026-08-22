import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireStudioLibraryWrite } from "@/lib/api/media";
import { completeLibraryAsset } from "@/lib/media/complete";
import { libraryMaxBytes, libraryTooLargeMessage, normalizeLibraryMime } from "@/lib/media/mime";
import { parseLibraryRole } from "@/lib/media/slots";
import { getMediaBucket, headWorkspaceObject } from "@/lib/r2/bucket";
import { assertLibraryObjectKey } from "@/lib/r2/keys";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ctx = await requireStudioLibraryWrite();
    const body = (await request.json()) as {
      objectKey?: string;
      mimeType?: string;
      sizeBytes?: number;
      role?: string;
    };
    const role = parseLibraryRole(String(body.role ?? ""));
    if (!role) {
      return jsonError("That library folder is not supported.", 400);
    }
    const mimeType = normalizeLibraryMime(String(body.mimeType ?? ""), role);
    const objectKey = String(body.objectKey ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);
    if (!mimeType) {
      return jsonError("That file type is not allowed.", 400);
    }
    assertLibraryObjectKey(objectKey, ctx.workspaceId, ctx.businessId, role);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > libraryMaxBytes(mimeType)) {
      return jsonError(libraryTooLargeMessage(mimeType), 400);
    }
    const stored = await headWorkspaceObject(
      await getMediaBucket(),
      ctx.workspaceId,
      objectKey,
    );
    if (!stored) {
      return jsonError("We could not find that upload. Try again.", 400);
    }
    const completed = await completeLibraryAsset(ctx.db, {
      workspaceId: ctx.workspaceId,
      businessId: ctx.businessId,
      ownerUserId: ctx.userId,
      role,
      objectKey,
      mimeType,
      sizeBytes: stored.size ?? sizeBytes,
    });
    return NextResponse.json({ ok: true, assetId: completed.assetId });
  } catch (error) {
    return fromCaught(error);
  }
}
