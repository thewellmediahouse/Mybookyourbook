import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { processSignedPaystackWebhook } from "@/lib/billing/webhook";
import { getDb } from "@/lib/db/client";
import { PaymentError, PAYSTACK_SIGNATURE_HEADER, tryGetPaymentProvider } from "@/lib/providers/payments";
import { getPaymentsEnv, getPaymentsSetup } from "@/lib/billing/provider";
import { assertRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get(PAYSTACK_SIGNATURE_HEADER);
    const env = await getPaymentsEnv();
    const setup = getPaymentsSetup(env);
    const provider = tryGetPaymentProvider(env);
    if (!provider || !setup.webhookSecret) {
      return jsonError("Payment is not connected.", 503);
    }
    const db = await getDb();
    await assertRateLimit(db, "webhook", "paystack");
    const result = await processSignedPaystackWebhook(db, {
      rawBody,
      signature,
      provider,
    });
    return NextResponse.json({ received: true, granted: result.granted }, { status: result.httpStatus });
  } catch (error) {
    if (error instanceof PaymentError && error.code === "INVALID_SIGNATURE") {
      return jsonError("We couldn't confirm that payment event.", 400);
    }
    return fromCaught(error);
  }
}
