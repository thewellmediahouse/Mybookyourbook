import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireStudioLibraryWrite } from "@/lib/api/media";
import { requireAssetAccess as loadAssetAccess } from "@/lib/authz/guards";
import { scheduleLibraryDelete } from "@/lib/media/delete";
import { queueObjectCleanups } from "@/lib/security/cleanup";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ assetId: string }> },
) {
  try {
    const { assetId } = await context.params;
    const ctx = await requireStudioLibraryWrite();
    const access = await loadAssetAccess(ctx.db, ctx.userId, assetId);
    if (access.workspace.id !== ctx.workspaceId) {
      return jsonError("Not found.", 404);
    }
    const keys = await scheduleLibraryDelete(ctx.db, assetId);
    await queueObjectCleanups(ctx.workspaceId, keys);
    return NextResponse.json({ ok: true, removed: keys.length });
  } catch (error) {
    return fromCaught(error);
  }
}
