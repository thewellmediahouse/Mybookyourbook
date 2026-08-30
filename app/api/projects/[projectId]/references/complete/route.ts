import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireProjectEditor } from "@/lib/api/projects";
import { LIBRARY_MAX_BYTES, normalizeLibraryMime } from "@/lib/media/mime";
import { completeProjectReferenceAsset } from "@/lib/projects/references";
import { getMediaBucket, headWorkspaceObject } from "@/lib/r2/bucket";
import { assertProjectReferenceObjectKey } from "@/lib/r2/keys";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const ctx = await requireProjectEditor(projectId);
    const body = (await request.json()) as {
      objectKey?: string;
      mimeType?: string;
      sizeBytes?: number;
    };
    const mimeType = normalizeLibraryMime(String(body.mimeType ?? ""), "campaign");
    const objectKey = String(body.objectKey ?? "");
    const sizeBytes = Number(body.sizeBytes ?? 0);
    if (!mimeType) {
      return jsonError("Use a PNG, JPEG, or WebP photo.", 400);
    }
    assertProjectReferenceObjectKey(objectKey, ctx.workspaceId, projectId);
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > LIBRARY_MAX_BYTES) {
      return jsonError("That photo is too large. Keep it under 8 MB.", 400);
    }
    const stored = await headWorkspaceObject(await getMediaBucket(), ctx.workspaceId, objectKey);
    if (!stored) {
      return jsonError("We could not find that upload. Try again.", 400);
    }
    const completed = await completeProjectReferenceAsset(ctx.db, {
      workspaceId: ctx.workspaceId,
      projectId,
      businessId: ctx.businessId,
      ownerUserId: ctx.userId,
      objectKey,
      mimeType,
      sizeBytes: stored.size ?? sizeBytes,
    });
    return NextResponse.json({
      ok: true,
      assetId: completed.assetId,
      referenceId: completed.referenceId,
    });
  } catch (error) {
    return fromCaught(error);
  }
}
