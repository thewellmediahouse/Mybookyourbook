import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireStudioIdentity } from "@/lib/api/identity";
import { recordIdentityConsent } from "@/lib/identity/consent";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const ctx = await requireStudioIdentity();
    const body = (await request.json()) as {
      likeness?: boolean;
      processing?: boolean;
      impersonation?: boolean;
      adult?: boolean;
    };
    if (!body.likeness || !body.processing || !body.impersonation || !body.adult) {
      return jsonError("All consent boxes must be checked before we can save identity files.", 400);
    }
    await recordIdentityConsent(ctx.db, {
      userId: ctx.userId,
      workspaceId: ctx.workspaceId,
      identityId: ctx.identity.id,
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return fromCaught(error);
  }
}
