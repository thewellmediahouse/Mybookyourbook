import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireTeamManager } from "@/lib/api/team";
import { getAuthBaseUrl } from "@/lib/auth/env";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { createInvitation } from "@/lib/workspaces/invite";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; role?: string };
    if (!body.email?.trim()) {
      return jsonError("Enter a valid email address.", 400);
    }
    if (!body.role) {
      return jsonError("Choose Admin, Creator, or Viewer. A studio can have only one owner.", 400);
    }
    const ctx = await requireTeamManager();
    const { env } = await getCloudflareContext({ async: true });
    const result = await createInvitation(ctx.db, ctx.member, { email: body.email, role: body.role }, {
      appUrl: getAuthBaseUrl(env),
      env,
    });
    return NextResponse.json({ invitationId: result.invitationId });
  } catch (error) {
    return fromCaught(error);
  }
}
