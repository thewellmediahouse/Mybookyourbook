import { NextResponse } from "next/server";
import { fromCaught, jsonError } from "@/lib/api/http";
import { processPayoneerNotification } from "@/lib/billing/webhook";
import { getDb } from "@/lib/db/client";
import {
  PaymentError,
  confirmPayoneerCharge,
  tryGetPaymentProvider,
} from "@/lib/providers/payments";
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
      setup.adapter !== "payoneer" ||
      !setup.payoneerUsername ||
      !setup.payoneerToken ||
      !setup.payoneerMode
    ) {
      return jsonError("Payment is not connected.", 503);
    }
    const payoneerMode = setup.payoneerMode;
    const username = setup.payoneerUsername;
    const token = setup.payoneerToken;
    const db = await getDb();
    await assertRateLimit(db, "webhook", "payoneer");
    const result = await processPayoneerNotification(db, {
      rawBody,
      provider,
      confirm: (longId) =>
        confirmPayoneerCharge({
          mode: payoneerMode,
          username,
          token,
          longId,
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
