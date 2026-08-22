import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireStudioLibraryWrite } from "@/lib/api/media";
import { libraryMaxBytes, libraryTooLargeMessage, normalizeLibraryMime } from "@/lib/media/mime";
import { parseLibraryRole } from "@/lib/media/slots";
import { getMediaBucket, putWorkspaceObject } from "@/lib/r2/bucket";
import { libraryObjectKey } from "@/lib/r2/keys";
import { assertAllowedUploadBytes } from "@/lib/r2/sniff";

export const dynamic = "force-dynamic";

export async function PUT(
  request: Request,
  context: { params: Promise<{ objectId: string }> },
) {
  try {
    const { objectId } = await context.params;
    const ctx = await requireStudioLibraryWrite();
    const role = parseLibraryRole(new URL(request.url).searchParams.get("role") ?? "");
    if (!role) {
      return jsonError("That library folder is not supported.", 400);
    }
    const mimeType = normalizeLibraryMime(request.headers.get("content-type") ?? "", role);
    if (!mimeType) {
      return jsonError(
        role === "logo" ? "Use a PNG, JPEG, WebP, or SVG logo." : "Use a PNG, JPEG, or WebP photo.",
        400,
      );
    }
    const body = await request.arrayBuffer();
    if (body.byteLength === 0 || body.byteLength > libraryMaxBytes(mimeType)) {
      return jsonError(libraryTooLargeMessage(mimeType), 400);
    }
    assertAllowedUploadBytes(new Uint8Array(body), mimeType);
    const objectKey = libraryObjectKey(ctx.workspaceId, ctx.businessId, role, objectId);
    await putWorkspaceObject(await getMediaBucket(), {
      workspaceId: ctx.workspaceId,
      objectKey,
      body,
      mimeType,
    });
    return NextResponse.json({ ok: true, sizeBytes: body.byteLength });
  } catch (error) {
    return fromCaught(error);
  }
}
