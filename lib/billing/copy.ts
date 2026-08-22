export const CHECKOUT_NOT_CONNECTED = "Payment is not connected.";
export const CHECKOUT_CUSTOM_PLAN =
  "This plan is arranged with us. It is not available at checkout.";
export const CHECKOUT_MONTHLY_UNAVAILABLE =
  "Monthly plans open after the subscription catalog is connected.";
export const CHECKOUT_REGION_MISMATCH =
  "That plan is not available for this studio's billing country.";
export const CHECKOUT_NO_SUBSCRIPTION = "There is no subscription to cancel yet.";
export const CHECKOUT_CANCEL_NEEDS_PROVIDER =
  "We couldn't cancel from here. Use the email from your payment provider, or contact us.";
export const REDIRECT_CONFIRMING =
  "We're confirming your payment. Credits appear after we receive confirmation from the payment provider.";
export const REDIRECT_SUCCESS = "Payment successful. Your credits are available.";
export const REDIRECT_REJECTED = "That payment could not be confirmed. No credits were added.";
export const REDIRECT_CANCELLED = "Payment was cancelled. No credits were added.";
export const CHECKOUT_CURRENCY_UNSUPPORTED =
  "Card payment is available for South African rand (ZAR) plans. International billing is not connected yet.";
export const PAYMENT_SUCCESS_TITLE = "Payment successful";
export const SUBSCRIPTION_UPDATED_TITLE = "Subscription updated";
export const NO_PAID_PLAN = "No paid plan is attached yet.";
export const NO_PAYMENT_METHOD = "None on file";
export const CARD_ON_FILE = "Card on file";

export function purchaseIdempotencyKey(provider: string, reference: string): string {
  return `purchase:${provider}:${reference}`;
}

export function paymentSuccessBody(credits: number, planName: string): string {
  const creditLabel = credits === 1 ? "1 Ad Credit" : `${credits} Ad Credits`;
  return `We added ${creditLabel} from ${planName}.`;
}

export function cardEndingLabel(last4: string): string {
  return `Card ending ${last4}`;
}

export function paymentStatusLabel(status: string): string {
  if (status === "success") {
    return "Paid";
  }
  if (status === "pending") {
    return "Waiting for confirmation";
  }
  if (status === "rejected") {
    return "Could not be confirmed";
  }
  if (status === "failed") {
    return "Payment did not go through";
  }
  if (status === "cancelled") {
    return "Cancelled";
  }
  return status;
}
