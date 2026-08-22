import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireApiSession } from "@/lib/api/auth";
import { getDb } from "@/lib/db/client";
import { acceptInvitation } from "@/lib/workspaces/invite";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string };
    if (!body.token) {
      return jsonError("This invitation is not valid or has expired.", 400);
    }
    const session = await requireApiSession();
    const db = await getDb();
    const result = await acceptInvitation(db, {
      userId: session.user.id,
      email: session.user.email,
      token: body.token,
    });
    return NextResponse.json({ workspaceId: result.workspaceId });
  } catch (error) {
    return fromCaught(error);
  }
}
