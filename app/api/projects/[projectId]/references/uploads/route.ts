import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireProjectEditor } from "@/lib/api/projects";
import { newId } from "@/lib/id";
import { LIBRARY_MAX_BYTES, normalizeLibraryMime } from "@/lib/media/mime";
import { listProjectReferenceSlots } from "@/lib/projects/references";
import { CONTEXT_REFERENCE_LIMIT } from "@/lib/projects/brief";
import { projectReferenceObjectKey } from "@/lib/r2/keys";
import { planObjectUpload } from "@/lib/r2/plan";
import { assertRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params;
    const ctx = await requireProjectEditor(projectId);
    await assertRateLimit(ctx.db, "upload", ctx.workspaceId);
    const existing = await listProjectReferenceSlots(ctx.db, projectId);
    if (existing.length >= CONTEXT_REFERENCE_LIMIT) {
      return jsonError("You can add up to 6 extra photos for this campaign.", 400);
    }
    const body = (await request.json()) as { mimeType?: string; sizeBytes?: number };
    const mimeType = normalizeLibraryMime(String(body.mimeType ?? ""), "campaign");
    const sizeBytes = Number(body.sizeBytes ?? 0);
    if (!mimeType) {
      return jsonError("Use a PNG, JPEG, or WebP photo.", 400);
    }
    if (!Number.isFinite(sizeBytes) || sizeBytes <= 0 || sizeBytes > LIBRARY_MAX_BYTES) {
      return jsonError("That photo is too large. Keep it under 8 MB.", 400);
    }
    const objectId = newId();
    const objectKey = projectReferenceObjectKey(ctx.workspaceId, projectId, objectId);
    const plan = await planObjectUpload({
      objectKey,
      mimeType,
      bindingPutUrl: `/api/projects/${projectId}/references/objects/${objectId}`,
    });
    return NextResponse.json({ objectKey, mimeType, sizeBytes, upload: plan });
  } catch (error) {
    return fromCaught(error);
  }
}
