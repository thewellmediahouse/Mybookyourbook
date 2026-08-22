import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireBillingOwner } from "@/lib/api/billing";
import { startCheckout } from "@/lib/billing/checkout";
import { getPlanById } from "@/lib/billing/plans";
import { checkoutCallbackUrl, getConnectedPaymentProvider, getPaymentsEnv } from "@/lib/billing/provider";
import { CHECKOUT_MONTHLY_UNAVAILABLE } from "@/lib/billing/copy";
import { PaymentError } from "@/lib/providers/payments";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { planId?: string };
    if (!body.planId) {
      return jsonError("Choose a monthly plan.", 400);
    }
    const ctx = await requireBillingOwner();
    const plan = await getPlanById(ctx.db, body.planId);
    if (!plan || plan.interval !== "month") {
      return jsonError("Choose a monthly plan.", 400);
    }
    const connected = await getConnectedPaymentProvider();
    const env = await getPaymentsEnv();
    const result = await startCheckout(ctx.db, {
      workspaceId: ctx.workspaceId,
      email: ctx.email,
      planId: body.planId,
      callbackUrl: checkoutCallbackUrl(env),
      provider: connected.provider,
      providerName: connected.adapter,
      requireProviderPlanCode: connected.requireProviderPlanCode,
    });
    return NextResponse.json({
      authorizationUrl: result.authorizationUrl,
      reference: result.reference,
    });
  } catch (error) {
    if (error instanceof PaymentError && error.code === "MONTHLY_UNAVAILABLE") {
      return jsonError(CHECKOUT_MONTHLY_UNAVAILABLE, 400);
    }
    return fromCaught(error);
  }
}
