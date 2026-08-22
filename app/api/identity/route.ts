import { NextResponse } from "next/server";
import { fromCaught } from "@/lib/api/http";
import { requireStudioIdentity } from "@/lib/api/identity";
import { requireCurrentConsent } from "@/lib/identity/consent";
import { scheduleIdentityDelete } from "@/lib/identity/delete";
import { queueObjectCleanups } from "@/lib/security/cleanup";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  try {
    const ctx = await requireStudioIdentity();
    await requireCurrentConsent(ctx.db, ctx.identity.id, ctx.userId);
    const url = new URL(request.url);
    const scopeParam = url.searchParams.get("scope");
    const scope = scopeParam === "photos" || scopeParam === "video" ? scopeParam : "all";
    const keys = await scheduleIdentityDelete(ctx.db, ctx.identity.id, scope);
    await queueObjectCleanups(ctx.workspaceId, keys);
    return NextResponse.json({ ok: true, removed: keys.length });
  } catch (error) {
    return fromCaught(error);
  }
}
