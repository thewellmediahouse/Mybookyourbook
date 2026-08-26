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
 * Payoneer Checkout (Optile) LIST + hosted page.
 * Official widget docs (fetched 2026-08-25): authenticated POST `/lists`
 * https://www.npmjs.com/package/@payoneer/op-payment-widget-v3
 * Hosts: api.{sandbox|live}.oscato.com, resources.{sandbox|live}.oscato.com
 */
export type PayoneerMode = "sandbox" | "live";

export const PAYONEER_LIST_MEDIA_TYPE =
  "application/vnd.optile.payment.enterprise-v1-extensible+json";
export const PAYONEER_ALLOWED_CURRENCIES = ["ZAR", "USD"] as const;
export const PAYONEER_LONG_ID = /^[A-Za-z0-9._-]{8,128}$/;

const MONTHLY_UNAVAILABLE = "Monthly plans open after recurring billing is connected.";
const CHECKOUT_CURRENCY =
  "Card payment can take South African rand or US dollar plans. That currency is not available yet.";
const CHECKOUT_AMOUNT = "That amount cannot be charged.";
const PROVIDER_UNAVAILABLE = "We couldn't start checkout. Try again.";
const CONFIRM_FAILED = "We couldn't confirm that payment event.";

export type PayoneerListRequest = {
  transactionId: string;
  country: string;
  customer: {
    number: string;
    email: string;
  };
  payment: {
    amount: number;
    currency: string;
    reference: string;
  };
  callback: {
    returnUrl: string;
    cancelUrl: string;
    notificationUrl: string;
  };
  style: {
    hostedVersion: "v3";
  };
};

export type PayoneerChargeView = {
  longId: string;
  transactionId: string;
  statusCode: string;
  amountMinor: number;
  currency: string;
};

export type PayoneerNotification = {
  notificationId?: string;
  transactionId?: string;
  longId?: string;
  interactionCode?: string;
  interactionReason?: string;
};

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

export function payoneerApiHost(mode: PayoneerMode): string {
  return mode === "live" ? "api.live.oscato.com" : "api.sandbox.oscato.com";
}

export function payoneerResourcesHost(mode: PayoneerMode): string {
  return mode === "live" ? "resources.live.oscato.com" : "resources.sandbox.oscato.com";
}

export function payoneerListsUrl(mode: PayoneerMode): string {
  return `https://${payoneerApiHost(mode)}/api/lists`;
}

export function payoneerChargeUrl(mode: PayoneerMode, longId: string): string {
  if (!PAYONEER_LONG_ID.test(longId)) {
    throw new PaymentError("INVALID_SIGNATURE", CONFIRM_FAILED);
  }
  return `https://${payoneerApiHost(mode)}/api/charges/${longId}`;
}

export function payoneerBasicAuth(username: string, token: string): string {
  return `Basic ${Buffer.from(`${username}:${token}`, "utf8").toString("base64")}`;
}

export function payoneerAmountFromMinor(amountMinor: number): number {
  return Math.round(amountMinor) / 100;
}

export function payoneerAmountToMinor(amount: number): number | null {
  if (!Number.isFinite(amount)) {
    return null;
  }
  return Math.round(amount * 100);
}

export function payoneerListCountry(country: string | undefined, currency: string): string {
  const code = (country ?? "").trim().toUpperCase();
  if (/^[A-Z]{2}$/.test(code)) {
    return code;
  }
  return currency.trim().toUpperCase() === "ZAR" ? "ZA" : "US";
}

export function buildPayoneerListRequest(input: {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  notificationUrl: string;
  country?: string;
  customerNumber?: string;
}): PayoneerListRequest {
  const currency = input.currency.trim().toUpperCase();
  const callback = new URL(input.callbackUrl);
  callback.searchParams.set("reference", input.reference);
  const cancel = new URL(input.callbackUrl);
  cancel.searchParams.set("reference", input.reference);
  cancel.searchParams.set("cancelled", "1");
  return {
    transactionId: clip(input.reference, 64),
    country: payoneerListCountry(input.country, currency),
    customer: {
      number: clip(input.customerNumber || input.email, 50),
      email: clip(input.email, 128),
    },
    payment: {
      amount: payoneerAmountFromMinor(input.amountMinor),
      currency,
      reference: clip(input.reference, 64),
    },
    callback: {
      returnUrl: callback.toString(),
      cancelUrl: cancel.toString(),
      notificationUrl: input.notificationUrl,
    },
    style: {
      hostedVersion: "v3",
    },
  };
}

export function payoneerHostedPageUrl(mode: PayoneerMode, listUrl: string): string {
  const page = new URL(`https://${payoneerResourcesHost(mode)}/paymentpage/v3/responsive.html`);
  page.searchParams.set("listUrl", listUrl);
  return page.toString();
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function parsePayoneerNotification(rawBody: string): PayoneerNotification {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new PaymentError("INVALID_SIGNATURE", CONFIRM_FAILED);
  }
  if (!parsed || typeof parsed !== "object") {
    throw new PaymentError("INVALID_SIGNATURE", CONFIRM_FAILED);
  }
  const record = asRecord(parsed);
  return {
    notificationId: readString(record.notificationId),
    transactionId: readString(record.transactionId),
    longId: readString(record.longId),
    interactionCode: readString(record.interactionCode),
    interactionReason: readString(record.interactionReason),
  };
}

export function payoneerNotificationToWebhookEvent(posted: PayoneerNotification): ParsedWebhookEvent {
  if (!posted.longId) {
    return { event: "payoneer.ignored", data: { reason: "missing-longId" } };
  }
  return {
    event: "payoneer.notification",
    data: {
      id: posted.longId,
      notificationId: posted.notificationId,
      reference: posted.transactionId,
      interactionCode: posted.interactionCode,
      interactionReason: posted.interactionReason,
    },
  };
}

export function parsePayoneerCharge(payload: unknown): PayoneerChargeView | null {
  const record = asRecord(payload);
  const identification = asRecord(record.identification);
  const status = asRecord(record.status);
  const payment = asRecord(record.payment);
  const longId = readString(identification.longId) ?? readString(record.longId);
  const transactionId = readString(identification.transactionId) ?? readString(record.transactionId);
  const statusCode = (readString(status.code) ?? "").toLowerCase();
  const amount = readNumber(payment.amount);
  const currency = readString(payment.currency)?.toUpperCase();
  const amountMinor = amount == null ? null : payoneerAmountToMinor(amount);
  if (!longId || !transactionId || amountMinor == null || !currency) {
    return null;
  }
  return {
    longId,
    transactionId,
    statusCode,
    amountMinor,
    currency,
  };
}

export function payoneerChargeToWebhookEvent(charge: PayoneerChargeView): ParsedWebhookEvent {
  if (charge.statusCode !== "charged") {
    return { event: "payoneer.ignored", data: { status: charge.statusCode } };
  }
  return {
    event: "charge.success",
    data: {
      id: charge.longId,
      status: "success",
      reference: charge.transactionId,
      amount: charge.amountMinor,
      currency: charge.currency,
      metadata: {},
    },
  };
}

function listSelfUrl(payload: unknown): string | null {
  const record = asRecord(payload);
  const links = asRecord(record.links);
  return readString(links.self) ?? readString(record.url) ?? null;
}

export async function confirmPayoneerCharge(input: {
  mode: PayoneerMode;
  username: string;
  token: string;
  longId: string;
  fetchImpl?: typeof fetch;
}): Promise<PayoneerChargeView | null> {
  const fetchFn = input.fetchImpl ?? fetch;
  const response = await fetchFn(payoneerChargeUrl(input.mode, input.longId), {
    method: "GET",
    headers: {
      Authorization: payoneerBasicAuth(input.username, input.token),
      Accept: PAYONEER_LIST_MEDIA_TYPE,
    },
  });
  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new PaymentError("PROVIDER", CONFIRM_FAILED);
  }
  const payload = (await response.json()) as unknown;
  return parsePayoneerCharge(payload);
}

export type PayoneerProviderOptions = {
  username: string;
  token: string;
  mode: PayoneerMode;
  appUrl: string;
  fetchImpl?: typeof fetch;
};

export function createPayoneerProvider(options: PayoneerProviderOptions): PaymentProvider {
  const appUrl = options.appUrl.replace(/\/$/, "");
  const fetchFn = options.fetchImpl ?? fetch;

  return {
    async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
      const currency = input.currency.trim().toUpperCase();
      if (!PAYONEER_ALLOWED_CURRENCIES.includes(currency as (typeof PAYONEER_ALLOWED_CURRENCIES)[number])) {
        throw new PaymentError("CURRENCY_MISMATCH", CHECKOUT_CURRENCY);
      }
      if (!Number.isFinite(input.amountMinor) || input.amountMinor <= 0) {
        throw new PaymentError("AMOUNT_MISMATCH", CHECKOUT_AMOUNT);
      }
      const body = buildPayoneerListRequest({
        email: input.email,
        amountMinor: input.amountMinor,
        currency,
        reference: input.reference,
        callbackUrl: input.callbackUrl,
        notificationUrl: `${appUrl}/api/webhooks/payoneer`,
        country: input.country,
        customerNumber: input.metadata.workspaceId,
      });
      let response: Response;
      try {
        response = await fetchFn(payoneerListsUrl(options.mode), {
          method: "POST",
          headers: {
            Authorization: payoneerBasicAuth(options.username, options.token),
            "Content-Type": PAYONEER_LIST_MEDIA_TYPE,
            Accept: PAYONEER_LIST_MEDIA_TYPE,
          },
          body: JSON.stringify(body),
        });
      } catch {
        throw new PaymentError("PROVIDER", PROVIDER_UNAVAILABLE);
      }
      if (!response.ok) {
        throw new PaymentError("PROVIDER", PROVIDER_UNAVAILABLE);
      }
      const payload = (await response.json()) as unknown;
      const listUrl = listSelfUrl(payload);
      if (!listUrl) {
        throw new PaymentError("PROVIDER", PROVIDER_UNAVAILABLE);
      }
      return {
        authorizationUrl: payoneerHostedPageUrl(options.mode, listUrl),
        accessCode: "payoneer",
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
      return payoneerNotificationToWebhookEvent(parsePayoneerNotification(request.rawBody));
    },
  };
}
