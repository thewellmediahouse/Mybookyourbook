import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { processSignedPayfastItn } from "@/lib/billing/webhook";
import { getDb } from "@/lib/db/client";
import {
  PaymentError,
  confirmPayfastServerValidation,
  parsePayfastForm,
  tryGetPaymentProvider,
} from "@/lib/providers/payments";
import { getPaymentsEnv, getPaymentsSetup } from "@/lib/billing/provider";
import { assertRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const posted = parsePayfastForm(rawBody);
    const env = await getPaymentsEnv();
    const setup = getPaymentsSetup(env);
    const provider = tryGetPaymentProvider(env);
    if (!provider || !setup.checkoutAvailable || !setup.merchantId || !setup.payfastMode) {
      return jsonError("Payment is not connected.", 503);
    }
    const db = await getDb();
    await assertRateLimit(db, "webhook", "payfast");
    const result = await processSignedPayfastItn(db, {
      rawBody,
      provider,
      merchantId: setup.merchantId,
      postedMerchantId: posted.merchant_id,
      confirm: () =>
        confirmPayfastServerValidation({
          mode: setup.payfastMode!,
          posted,
        }),
    });
    return NextResponse.json({ received: true, granted: result.granted }, { status: result.httpStatus });
  } catch (error) {
    if (error instanceof PaymentError && error.code === "INVALID_SIGNATURE") {
      return jsonError("We couldn't confirm that payment event.", 400);
    }
    return fromCaught(error);
  }
}
