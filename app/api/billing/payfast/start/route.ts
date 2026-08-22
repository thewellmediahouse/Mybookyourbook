import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { requireBillingOwner } from "@/lib/api/billing";
import { checkoutCallbackUrl, getPaymentsEnv, getPaymentsSetup } from "@/lib/billing/provider";
import { getPaymentByProviderReference } from "@/lib/billing/queries";
import { getAuthBaseUrl } from "@/lib/auth/env";
import {
  buildPayfastCheckoutFields,
  generatePayfastCheckoutSignature,
  payfastCheckoutHtml,
  payfastProcessUrl,
} from "@/lib/providers/payments/payfast";

export const dynamic = "force-dynamic";

function planNameFromMeta(raw: string | null): string {
  if (!raw) {
    return "Ad Credits";
  }
  try {
    const value = JSON.parse(raw) as { planName?: unknown };
    return typeof value.planName === "string" && value.planName.trim() ? value.planName.trim() : "Ad Credits";
  } catch {
    return "Ad Credits";
  }
}

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const reference = url.searchParams.get("reference")?.trim() ?? "";
    if (!reference) {
      return jsonError("That payment could not be started.", 400);
    }
    const ctx = await requireBillingOwner();
    const payment = await getPaymentByProviderReference(ctx.db, reference);
    if (!payment || payment.workspaceId !== ctx.workspaceId || payment.status !== "pending") {
      return jsonError("That payment could not be started.", 404);
    }
    const env = await getPaymentsEnv();
    const setup = getPaymentsSetup(env);
    if (
      setup.adapter !== "payfast" ||
      !setup.checkoutAvailable ||
      !setup.merchantId ||
      !setup.merchantKey ||
      !setup.payfastMode
    ) {
      return jsonError("Payment is not connected.", 503);
    }
    const appUrl = getAuthBaseUrl(env);
    const callback = checkoutCallbackUrl(env);
    const returnUrl = new URL(callback);
    returnUrl.searchParams.set("reference", reference);
    const cancelUrl = new URL(callback);
    cancelUrl.searchParams.set("reference", reference);
    cancelUrl.searchParams.set("cancelled", "1");
    const fields = buildPayfastCheckoutFields({
      merchantId: setup.merchantId,
      merchantKey: setup.merchantKey,
      returnUrl: returnUrl.toString(),
      cancelUrl: cancelUrl.toString(),
      notifyUrl: `${appUrl.replace(/\/$/, "")}/api/webhooks/payfast`,
      email: ctx.email,
      customerName: ctx.session.user.name,
      reference,
      amountMinor: payment.amountMinor,
      itemName: planNameFromMeta(payment.metadataJson),
      workspaceId: payment.workspaceId,
      planId: (() => {
        try {
          const meta = JSON.parse(payment.metadataJson ?? "{}") as { planId?: unknown };
          return typeof meta.planId === "string" ? meta.planId : undefined;
        } catch {
          return undefined;
        }
      })(),
      paymentId: payment.id,
    });
    const signature = generatePayfastCheckoutSignature(fields, setup.passphrase);
    const html = payfastCheckoutHtml({
      action: payfastProcessUrl(setup.payfastMode),
      fields,
      signature,
    });
    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return fromCaught(error);
  }
}
