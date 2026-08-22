import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireBillingOwner } from "@/lib/api/billing";
import { startCheckout } from "@/lib/billing/checkout";
import { checkoutCallbackUrl, getConnectedPaymentProvider, getPaymentsEnv } from "@/lib/billing/provider";
import { PaymentError } from "@/lib/providers/payments";
import { assertRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { planId?: string };
    if (!body.planId) {
      return jsonError("Choose a plan.", 400);
    }
    const ctx = await requireBillingOwner();
    await assertRateLimit(ctx.db, "checkout", ctx.workspaceId);
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
      return jsonError(error.message, 400);
    }
    return fromCaught(error);
  }
}
