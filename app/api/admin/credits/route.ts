import { NextResponse } from "next/server";
import { fromAdminCaught, jsonError } from "@/lib/api/http";
import { requireAdminApi } from "@/lib/admin/access";
import { parseAdminEmails } from "@/lib/authz/admin";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { adminDeductCredits, adminGrantCredits } from "@/lib/admin/credits";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      workspaceId?: string;
      amount?: number;
      reason?: string;
      direction?: string;
    };
    if (!body.workspaceId || !body.amount || !body.reason) {
      return jsonError("Workspace, amount, and reason are required.", 400);
    }
    const session = await requireAdminApi();
    const { env } = await getCloudflareContext({ async: true });
    const adminEmails = parseAdminEmails(
      "ADMIN_EMAILS" in env ? String((env as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "") : "",
    );
    const actor = { ...session, adminEmails };
    const row =
      body.direction === "deduct"
        ? await adminDeductCredits(session.db, actor, {
            workspaceId: body.workspaceId,
            amount: body.amount,
            reason: body.reason,
          })
        : await adminGrantCredits(session.db, actor, {
            workspaceId: body.workspaceId,
            amount: body.amount,
            reason: body.reason,
          });
    return NextResponse.json({ transactionId: row.id });
  } catch (error) {
    return fromAdminCaught(error);
  }
}
