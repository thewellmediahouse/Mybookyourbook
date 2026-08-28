import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { PaymentError } from "./errors";
import type {
  CreateSubscriptionResult,
  PaymentCheckoutInput,
  PaymentCheckoutResult,
  PaymentProvider,
  ParsedWebhookEvent,
  VerifiedPayment,
  WebhookRequest,
} from "./types";

/**
 * Rapyd Collect hosted checkout.
 * Official docs (fetched 2026-08-28):
 * - Create Checkout Page https://docs.rapyd.net/en/create-checkout-page.html
 * - Request Signatures https://docs.rapyd.net/en/request-signatures.html
 * - Retrieve Payment https://docs.rapyd.net/en/retrieve-payment.html
 * - Payment Completed Webhook https://docs.rapyd.net/en/payment-completed-webhook.html
 * - Webhook Authentication https://docs.rapyd.net/en/webhook-authentication.html
 */
export type RapydMode = "sandbox" | "live";

export const RAPYD_ALLOWED_CURRENCIES = ["ZAR", "USD"] as const;
export const RAPYD_PAYMENT_ID = /^payment_[A-Za-z0-9]+$/;
export const RAPYD_CHECKOUT_ID = /^checkout_[A-Za-z0-9]+$/;

const MONTHLY_UNAVAILABLE = "Monthly plans open after recurring billing is connected.";
const CHECKOUT_CURRENCY =
  "Card payment can take South African rand or US dollar plans. That currency is not available yet.";
const CHECKOUT_AMOUNT = "That amount cannot be charged.";
const PROVIDER_UNAVAILABLE = "We couldn't start checkout. Try again.";
const CONFIRM_FAILED = "We couldn't confirm that payment event.";

export type RapydCheckoutRequest = {
  amount: number;
  country: string;
  currency: string;
  merchant_reference_id: string;
  metadata: Record<string, string>;
  complete_checkout_url?: string;
  cancel_checkout_url?: string;
};

export type RapydPaymentView = {
  paymentId: string;
  reference: string;
  status: string;
  paid: boolean;
  amountMinor: number;
  currency: string;
  last4?: string;
  brand?: string;
};

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

export function rapydApiHost(mode: RapydMode): string {
  return mode === "live" ? "api.rapyd.net" : "sandboxapi.rapyd.net";
}

export function rapydApiUrl(mode: RapydMode, path: string): string {
  return `https://${rapydApiHost(mode)}${path}`;
}

export function rapydPaymentUrl(mode: RapydMode, paymentId: string): string {
  if (!RAPYD_PAYMENT_ID.test(paymentId)) {
    throw new PaymentError("INVALID_SIGNATURE", CONFIRM_FAILED);
  }
  return rapydApiUrl(mode, `/v1/payments/${paymentId}`);
}

export function rapydCountry(country: string | undefined, currency: string): string {
  const code = (country ?? "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) {
    return code;
  }
  return currency.trim().toUpperCase() === "ZAR" ? "ZA" : "US";
}

export function rapydAmountFromMinor(amountMinor: number): number {
  return Math.round(amountMinor) / 100;
}

export function rapydAmountToMinor(amount: number): number | null {
  if (!Number.isFinite(amount)) {
    return null;
  }
  return Math.round(amount * 100);
}

export function rapydPublicReturnUrl(callbackUrl: string): string | undefined {
  try {
    const url = new URL(callbackUrl);
    if (url.protocol !== "https:") {
      return undefined;
    }
    if (url.hostname === "localhost" || url.hostname === "127.0.0.1") {
      return undefined;
    }
    return url.toString();
  } catch {
    return undefined;
  }
}

export function rapydSalt(): string {
  return randomBytes(8).toString("hex");
}

export function rapydTimestamp(): string {
  return String(Math.floor(Date.now() / 1000));
}

/** Official Node sample: Base64(HMAC-SHA256(...).digest("hex")). */
export function rapydHmacSignature(toSign: string, secretKey: string): string {
  const hex = createHmac("sha256", secretKey).update(toSign).digest("hex");
  return Buffer.from(hex).toString("base64");
}

export function rapydRequestSignature(input: {
  method: string;
  urlPath: string;
  salt: string;
  timestamp: string | number;
  accessKey: string;
  secretKey: string;
  body: string;
}): string {
  const toSign =
    input.method.toLowerCase() +
    input.urlPath +
    input.salt +
    String(input.timestamp) +
    input.accessKey +
    input.secretKey +
    input.body;
  return rapydHmacSignature(toSign, input.secretKey);
}

export function rapydWebhookSignature(input: {
  webhookUrl: string;
  salt: string;
  timestamp: string | number;
  accessKey: string;
  secretKey: string;
  body: string;
}): string {
  const toSign =
    input.webhookUrl +
    input.salt +
    String(input.timestamp) +
    input.accessKey +
    input.secretKey +
    input.body;
  return rapydHmacSignature(toSign, input.secretKey);
}

export function signaturesMatch(expected: string, received: string): boolean {
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

export function buildRapydCheckoutRequest(input: {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  country?: string;
  metadata: Record<string, string>;
}): RapydCheckoutRequest {
  const currency = input.currency.trim().toUpperCase();
  const complete = rapydPublicReturnUrl(
    `${input.callbackUrl}${input.callbackUrl.includes("?") ? "&" : "?"}reference=${encodeURIComponent(input.reference)}`,
  );
  const cancel = rapydPublicReturnUrl(
    `${input.callbackUrl}${input.callbackUrl.includes("?") ? "&" : "?"}cancelled=1`,
  );
  const body: RapydCheckoutRequest = {
    amount: rapydAmountFromMinor(input.amountMinor),
    country: rapydCountry(input.country, currency),
    currency,
    merchant_reference_id: clip(input.reference, 80),
    metadata: {
      workspaceId: clip(input.metadata.workspaceId ?? "", 80),
      planId: clip(input.metadata.planId ?? "", 80),
      paymentId: clip(input.metadata.paymentId ?? "", 80),
      email: clip(input.email, 120),
    },
  };
  if (complete) {
    body.complete_checkout_url = complete;
  }
  if (cancel) {
    body.cancel_checkout_url = cancel;
  }
  return body;
}

export function parseRapydCheckout(payload: unknown): { redirectUrl: string; checkoutId: string } | null {
  const root = asRecord(payload);
  const status = asRecord(root.status);
  if (readString(status.status)?.toUpperCase() !== "SUCCESS") {
    return null;
  }
  const data = asRecord(root.data);
  const redirectUrl = readString(data.redirect_url);
  const checkoutId = readString(data.id);
  if (!redirectUrl || !checkoutId || !RAPYD_CHECKOUT_ID.test(checkoutId)) {
    return null;
  }
  return { redirectUrl, checkoutId };
}

export function parseRapydPayment(payload: unknown): RapydPaymentView | null {
  const root = asRecord(payload);
  const envelope = asRecord(root.status);
  const data = Object.keys(envelope).length > 0 ? asRecord(root.data) : root;
  if (Object.keys(envelope).length > 0 && readString(envelope.status)?.toUpperCase() === "ERROR") {
    return null;
  }
  const paymentId = readString(data.id);
  const reference = readString(data.merchant_reference_id);
  const status = readString(data.status)?.toUpperCase();
  const currency = (readString(data.currency_code) ?? readString(data.currency) ?? "").toUpperCase();
  const amount = readNumber(data.amount) ?? readNumber(data.original_amount);
  if (!paymentId || !RAPYD_PAYMENT_ID.test(paymentId) || !reference || !status || !currency || amount == null) {
    return null;
  }
  const amountMinor = rapydAmountToMinor(amount);
  if (amountMinor == null) {
    return null;
  }
  const method = asRecord(data.payment_method_data);
  const bin = asRecord(method.bin_details);
  return {
    paymentId,
    reference,
    status,
    paid: readBoolean(data.paid),
    amountMinor,
    currency,
    last4: readString(method.last4),
    brand: readString(bin.brand) ?? readString(method.brand),
  };
}

export function parseRapydWebhook(rawBody: string): {
  type: string;
  webhookId: string | null;
  paymentId: string | null;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new PaymentError("INVALID_SIGNATURE", CONFIRM_FAILED);
  }
  const root = asRecord(parsed);
  const data = asRecord(root.data);
  return {
    type: (readString(root.type) ?? "").toUpperCase(),
    webhookId: readString(root.id) ?? null,
    paymentId: readString(data.id) ?? null,
  };
}

export function rapydPaymentToWebhookEvent(payment: RapydPaymentView): ParsedWebhookEvent {
  const closed = payment.status === "CLO" && payment.paid;
  return {
    event: closed ? "charge.success" : "rapyd.ignored",
    data: {
      id: payment.paymentId,
      status: closed ? "success" : payment.status.toLowerCase(),
      reference: payment.reference,
      amount: payment.amountMinor,
      currency: payment.currency,
      metadata: {},
      authorization: {
        last4: payment.last4,
        brand: payment.brand,
      },
    },
  };
}

export async function rapydSignedFetch(input: {
  mode: RapydMode;
  accessKey: string;
  secretKey: string;
  method: "GET" | "POST";
  urlPath: string;
  body?: string;
  idempotency?: string;
  fetchImpl?: typeof fetch;
}): Promise<Response> {
  const fetchFn = input.fetchImpl ?? fetch;
  const salt = rapydSalt();
  const timestamp = rapydTimestamp();
  const body = input.body ?? "";
  const signature = rapydRequestSignature({
    method: input.method,
    urlPath: input.urlPath,
    salt,
    timestamp,
    accessKey: input.accessKey,
    secretKey: input.secretKey,
    body,
  });
  return fetchFn(rapydApiUrl(input.mode, input.urlPath), {
    method: input.method,
    headers: {
      "Content-Type": "application/json",
      access_key: input.accessKey,
      salt,
      timestamp,
      signature,
      ...(input.idempotency ? { idempotency: input.idempotency } : {}),
    },
    ...(body ? { body } : {}),
  });
}

export async function confirmRapydPayment(input: {
  mode: RapydMode;
  accessKey: string;
  secretKey: string;
  paymentId: string;
  fetchImpl?: typeof fetch;
}): Promise<RapydPaymentView | null> {
  if (!RAPYD_PAYMENT_ID.test(input.paymentId)) {
    throw new PaymentError("INVALID_SIGNATURE", CONFIRM_FAILED);
  }
  let response: Response;
  try {
    response = await rapydSignedFetch({
      mode: input.mode,
      accessKey: input.accessKey,
      secretKey: input.secretKey,
      method: "GET",
      urlPath: `/v1/payments/${input.paymentId}`,
      fetchImpl: input.fetchImpl,
    });
  } catch {
    throw new PaymentError("PROVIDER", CONFIRM_FAILED);
  }
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new PaymentError("PROVIDER", CONFIRM_FAILED);
  }
  const payload = (await response.json()) as unknown;
  return parseRapydPayment(payload);
}

export function verifyRapydWebhookSignature(input: {
  webhookUrl: string;
  accessKey: string;
  secretKey: string;
  rawBody: string;
  salt: string | null;
  timestamp: string | null;
  signature: string | null;
}): boolean {
  const salt = input.salt?.trim() ?? "";
  const timestamp = input.timestamp?.trim() ?? "";
  const signature = input.signature?.trim() ?? "";
  if (!salt || !timestamp || !signature) {
    return false;
  }
  const expected = rapydWebhookSignature({
    webhookUrl: input.webhookUrl,
    salt,
    timestamp,
    accessKey: input.accessKey,
    secretKey: input.secretKey,
    body: input.rawBody,
  });
  return signaturesMatch(expected, signature);
}

export type RapydProviderOptions = {
  accessKey: string;
  secretKey: string;
  mode: RapydMode;
  appUrl: string;
  webhookUrl?: string;
  fetchImpl?: typeof fetch;
};

export function createRapydProvider(options: RapydProviderOptions): PaymentProvider {
  const fetchFn = options.fetchImpl ?? fetch;

  return {
    async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
      const currency = input.currency.trim().toUpperCase();
      if (!RAPYD_ALLOWED_CURRENCIES.includes(currency as (typeof RAPYD_ALLOWED_CURRENCIES)[number])) {
        throw new PaymentError("CURRENCY_MISMATCH", CHECKOUT_CURRENCY);
      }
      if (!Number.isFinite(input.amountMinor) || input.amountMinor <= 0) {
        throw new PaymentError("AMOUNT_MISMATCH", CHECKOUT_AMOUNT);
      }
      const requestBody = buildRapydCheckoutRequest({
        email: input.email,
        amountMinor: input.amountMinor,
        currency,
        reference: input.reference,
        callbackUrl: input.callbackUrl,
        country: input.country,
        metadata: input.metadata,
      });
      const body = JSON.stringify(requestBody);
      let response: Response;
      try {
        response = await rapydSignedFetch({
          mode: options.mode,
          accessKey: options.accessKey,
          secretKey: options.secretKey,
          method: "POST",
          urlPath: "/v1/checkout",
          body,
          idempotency: input.reference,
          fetchImpl: fetchFn,
        });
      } catch {
        throw new PaymentError("PROVIDER", PROVIDER_UNAVAILABLE);
      }
      if (!response.ok) {
        throw new PaymentError("PROVIDER", PROVIDER_UNAVAILABLE);
      }
      const checkout = parseRapydCheckout((await response.json()) as unknown);
      if (!checkout) {
        throw new PaymentError("PROVIDER", PROVIDER_UNAVAILABLE);
      }
      return {
        authorizationUrl: checkout.redirectUrl,
        accessCode: checkout.checkoutId,
        reference: input.reference,
      };
    },

    async verifyPayment(reference: string): Promise<VerifiedPayment> {
      return {
        status: "pending",
        reference,
        amountMinor: 0,
        currency: "",
        metadata: {},
      };
    },

    async createSubscription(): Promise<CreateSubscriptionResult> {
      throw new PaymentError("MONTHLY_UNAVAILABLE", MONTHLY_UNAVAILABLE);
    },

    async cancelSubscription(): Promise<void> {
      throw new PaymentError("NO_SUBSCRIPTION", MONTHLY_UNAVAILABLE);
    },

    handleWebhook(request: WebhookRequest): ParsedWebhookEvent {
      const parsed = parseRapydWebhook(request.rawBody);
      return {
        event:
          parsed.type === "PAYMENT_COMPLETED" || parsed.type === "PAYMENT_SUCCEEDED"
            ? "rapyd.notification"
            : "rapyd.ignored",
        data: {
          id: parsed.paymentId,
          webhookId: parsed.webhookId,
          type: parsed.type,
        },
      };
    },
  };
}
