import { NextResponse } from "next/server";
import { fromCaught } from "@/lib/api/http";
import { requireBillingOwner } from "@/lib/api/billing";
import { cancelWorkspaceSubscription } from "@/lib/billing/cancel";
import { getConnectedPaymentProvider } from "@/lib/billing/provider";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const ctx = await requireBillingOwner();
    const connected = await getConnectedPaymentProvider();
    const result = await cancelWorkspaceSubscription(ctx.db, {
      workspaceId: ctx.workspaceId,
      provider: connected.provider,
      adapter: connected.adapter,
    });
    return NextResponse.json({
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    });
  } catch (error) {
    return fromCaught(error);
  }
}
