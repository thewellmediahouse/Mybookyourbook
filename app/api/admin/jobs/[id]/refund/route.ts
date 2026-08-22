import { NextResponse } from "next/server";
import { fromAdminCaught } from "@/lib/api/http";
import { requireAdminApi } from "@/lib/admin/access";
import { parseAdminEmails } from "@/lib/authz/admin";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { adminRefundJob } from "@/lib/admin/jobs";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const session = await requireAdminApi();
    const { env } = await getCloudflareContext({ async: true });
    const adminEmails = parseAdminEmails(
      "ADMIN_EMAILS" in env ? String((env as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "") : "",
    );
    const refund = await adminRefundJob(session.db, { ...session, adminEmails }, id);
    return NextResponse.json({ refundId: refund.id });
  } catch (error) {
    return fromAdminCaught(error);
  }
}
