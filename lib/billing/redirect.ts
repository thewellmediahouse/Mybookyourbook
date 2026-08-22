import { getPaymentByProviderReference } from "./queries";
import { REDIRECT_CANCELLED, REDIRECT_CONFIRMING, REDIRECT_REJECTED, REDIRECT_SUCCESS } from "./copy";
import type { Db } from "@/lib/db/client";

/**
 * Redirect query params are display-only. This never grants credits.
 */
export async function inspectCheckoutRedirect(
  db: Db,
  params: {
    reference?: string | null;
    success?: string | null;
    trxref?: string | null;
    cancelled?: string | null;
  },
) {
  const reference = params.reference?.trim() || params.trxref?.trim() || "";
  if (!reference) {
    return { reference: null as string | null, message: null as string | null, granted: false };
  }
  if (params.cancelled === "1" || params.cancelled === "true") {
    return { reference, message: REDIRECT_CANCELLED, granted: false };
  }
  const payment = await getPaymentByProviderReference(db, reference);
  if (!payment) {
    return { reference, message: REDIRECT_CONFIRMING, granted: false };
  }
  if (payment.status === "success") {
    return { reference, message: REDIRECT_SUCCESS, granted: false };
  }
  if (payment.status === "rejected" || payment.status === "failed") {
    return { reference, message: REDIRECT_REJECTED, granted: false };
  }
  return { reference, message: REDIRECT_CONFIRMING, granted: false };
}
