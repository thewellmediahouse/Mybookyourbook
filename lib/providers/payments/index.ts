import { getAuthBaseUrl } from "@/lib/auth/env";
import { PaymentError } from "./errors";
import { createMockPaymentProvider } from "./mock";
import { getPaymentsSetup, type PaymentsEnv } from "./mode";
import { createPayfastProvider } from "./payfast";
import { createPayoneerProvider } from "./payoneer";
import type { PaymentProvider } from "./types";

export { PaymentError } from "./errors";
export type { PaymentErrorCode } from "./errors";
export { getPaymentsSetup, isLivePayments } from "./mode";
export type { PaymentsEnv, PaymentsSetup, PaymentsAdapter } from "./mode";
export { createMockPaymentProvider } from "./mock";
export {
  buildPayoneerListRequest,
  confirmPayoneerCharge,
  createPayoneerProvider,
  parsePayoneerCharge,
  parsePayoneerNotification,
  payoneerAmountFromMinor,
  payoneerAmountToMinor,
  payoneerChargeToWebhookEvent,
  payoneerChargeUrl,
  payoneerHostedPageUrl,
  payoneerListCountry,
  payoneerListsUrl,
  payoneerNotificationToWebhookEvent,
} from "./payoneer";
export type { PayoneerChargeView, PayoneerMode } from "./payoneer";
export { createPaystackProvider } from "./paystack";
export {
  confirmPayfastServerValidation,
  createPayfastProvider,
  generatePayfastCheckoutSignature,
  md5Hex,
  parsePayfastForm,
  payfastCheckoutHtml,
  payfastProcessUrl,
  payfastUrlEncode,
  sanitizePayfastPayload,
  verifyPayfastItnSignature,
} from "./payfast";
export { PAYSTACK_SIGNATURE_HEADER, signPaystackBody, verifyPaystackSignature } from "./signature";
export type {
  CancelSubscriptionInput,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  ParsedWebhookEvent,
  PaymentCheckoutInput,
  PaymentCheckoutResult,
  PaymentProvider,
  VerifiedPayment,
  WebhookRequest,
} from "./types";

export function getPaymentProvider(
  env: PaymentsEnv & { BETTER_AUTH_URL?: string; NEXT_PUBLIC_APP_URL?: string },
): PaymentProvider {
  const setup = getPaymentsSetup(env);
  const appUrl = getAuthBaseUrl(env);
  if (setup.adapter === "mock") {
    return createMockPaymentProvider({
      appUrl,
      webhookSecret: setup.webhookSecret ?? undefined,
    });
  }
  if (setup.adapter === "payoneer") {
    if (!setup.checkoutAvailable || !setup.payoneerUsername || !setup.payoneerToken || !setup.payoneerMode) {
      throw new PaymentError("NOT_CONNECTED", "Payment is not connected.");
    }
    return createPayoneerProvider({
      username: setup.payoneerUsername,
      token: setup.payoneerToken,
      mode: setup.payoneerMode,
      appUrl,
    });
  }
  if (!setup.checkoutAvailable || !setup.merchantId || !setup.merchantKey || !setup.payfastMode) {
    throw new PaymentError("NOT_CONNECTED", "Payment is not connected.");
  }
  return createPayfastProvider({
    merchantId: setup.merchantId,
    merchantKey: setup.merchantKey,
    passphrase: setup.passphrase,
    mode: setup.payfastMode,
    appUrl,
  });
}

export function tryGetPaymentProvider(
  env: PaymentsEnv & { BETTER_AUTH_URL?: string; NEXT_PUBLIC_APP_URL?: string },
): PaymentProvider | null {
  try {
    return getPaymentProvider(env);
  } catch (error) {
    if (error instanceof PaymentError && error.code === "NOT_CONNECTED") {
      return null;
    }
    throw error;
  }
}
