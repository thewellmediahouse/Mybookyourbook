import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { processRapydNotification } from "@/lib/billing/webhook";
import { getDb } from "@/lib/db/client";
import {
  PaymentError,
  confirmRapydPayment,
  tryGetPaymentProvider,
  verifyRapydWebhookSignature,
} from "@/lib/providers/payments";
import { getAuthBaseUrl } from "@/lib/auth/env";
import { getPaymentsEnv, getPaymentsSetup } from "@/lib/billing/provider";
import { assertRateLimit } from "@/lib/security/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const rawBody = await request.text();
    const env = await getPaymentsEnv();
    const setup = getPaymentsSetup(env);
    const provider = tryGetPaymentProvider(env);
    if (
      !provider ||
      !setup.checkoutAvailable ||
      setup.adapter !== "rapyd" ||
      !setup.rapydAccessKey ||
      !setup.rapydSecretKey ||
      !setup.rapydMode
    ) {
      return jsonError("Payment is not connected.", 503);
    }
    const accessKey = setup.rapydAccessKey;
    const secretKey = setup.rapydSecretKey;
    const rapydMode = setup.rapydMode;
    const webhookUrl =
      setup.rapydWebhookUrl || `${getAuthBaseUrl(env).replace(/\/$/, "")}/api/webhooks/rapyd`;
    const signatureOk = verifyRapydWebhookSignature({
      webhookUrl,
      accessKey,
      secretKey,
      rawBody,
      salt: request.headers.get("salt"),
      timestamp: request.headers.get("timestamp"),
      signature: request.headers.get("signature"),
    });
    const db = await getDb();
    await assertRateLimit(db, "webhook", "rapyd");
    const result = await processRapydNotification(db, {
      rawBody,
      signatureOk,
      provider,
      confirm: (paymentId) =>
        confirmRapydPayment({
          mode: rapydMode,
          accessKey,
          secretKey,
          paymentId,
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
