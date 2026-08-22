import { createHash } from "node:crypto";
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
 * Checkout field order from PayFast Custom Integration attribute list
 * (fetched 2026-08-22, https://developers.payfast.co.za/docs). Not alphabetical.
 */
export const PAYFAST_CHECKOUT_FIELD_ORDER = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "fica_id_number",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
] as const;

export type PayFastMode = "sandbox" | "live";

export type PayFastFields = Record<string, string>;

export const PAYFAST_MIN_AMOUNT_MINOR = 500;
export const PAYFAST_CURRENCY = "ZAR";

const CHECKOUT_CURRENCY =
  "Card payment is available for South African rand (ZAR) plans. International billing is not connected yet.";
const CHECKOUT_AMOUNT = "That amount is below the minimum PayFast charge.";
const MONTHLY_UNAVAILABLE = "Monthly plans open after recurring billing is connected.";

export function md5Hex(message: string): string {
  return createHash("md5").update(message, "utf8").digest("hex");
}

/** PHP urlencode: spaces as +, hex escapes uppercase. Official PayFast signature rule. */
export function payfastUrlEncode(value: string): string {
  return encodeURIComponent(value.trim())
    .replace(/%20/g, "+")
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`)
    .replace(/%[0-9a-f]{2}/gi, (match) => match.toUpperCase());
}

export function formatPayfastAmount(zar: number): string {
  return (Math.round(zar * 100) / 100).toFixed(2);
}

export function amountMinorToPayfast(amountMinor: number): string {
  return formatPayfastAmount(amountMinor / 100);
}

export function payfastAmountToMinor(amountGross: string): number | null {
  const received = Number.parseFloat(amountGross);
  if (!Number.isFinite(received)) {
    return null;
  }
  return Math.round(received * 100);
}

export function amountsMatchMinor(expectedMinor: number, amountGross: string): boolean {
  const received = payfastAmountToMinor(amountGross);
  if (received == null) {
    return false;
  }
  return Math.abs(expectedMinor - received) <= 1;
}

export function generatePayfastCheckoutSignature(fields: PayFastFields, passphrase?: string | null): string {
  const pairs: string[] = [];
  for (const key of PAYFAST_CHECKOUT_FIELD_ORDER) {
    const raw = fields[key];
    if (raw === undefined || raw === null) {
      continue;
    }
    const value = String(raw).trim();
    if (value === "") {
      continue;
    }
    pairs.push(`${key}=${payfastUrlEncode(value)}`);
  }
  let paramString = pairs.join("&");
  const salt = (passphrase || "").trim();
  if (salt) {
    paramString += `&passphrase=${payfastUrlEncode(salt)}`;
  }
  return md5Hex(paramString);
}

/**
 * ITN signature uses posted field order until `signature` (official PHP sample).
 */
export function verifyPayfastItnSignature(posted: PayFastFields, passphrase?: string | null): boolean {
  const provided = (posted.signature || "").trim().toLowerCase();
  if (!provided) {
    return false;
  }
  const pairs: string[] = [];
  for (const [key, raw] of Object.entries(posted)) {
    if (key === "signature") {
      break;
    }
    pairs.push(`${key}=${payfastUrlEncode(String(raw ?? ""))}`);
  }
  let paramString = pairs.join("&");
  const salt = (passphrase || "").trim();
  if (salt) {
    paramString += `&passphrase=${payfastUrlEncode(salt)}`;
  }
  return md5Hex(paramString) === provided;
}

export function payfastProcessUrl(mode: PayFastMode): string {
  const host = mode === "live" ? "www.payfast.co.za" : "sandbox.payfast.co.za";
  return `https://${host}/eng/process`;
}

export function payfastValidateUrl(mode: PayFastMode): string {
  const host = mode === "live" ? "www.payfast.co.za" : "sandbox.payfast.co.za";
  return `https://${host}/eng/query/validate`;
}

export function payfastParamStringUntilSignature(posted: PayFastFields): string {
  const pairs: string[] = [];
  for (const [key, raw] of Object.entries(posted)) {
    if (key === "signature") {
      break;
    }
    pairs.push(`${key}=${payfastUrlEncode(String(raw ?? ""))}`);
  }
  return pairs.join("&");
}

export function sanitizePayfastPayload(posted: PayFastFields): PayFastFields {
  const safe: PayFastFields = {};
  for (const [key, value] of Object.entries(posted)) {
    if (key === "signature" || key === "merchant_key" || key === "passphrase") {
      continue;
    }
    safe[key] = String(value).slice(0, 500);
  }
  return safe;
}

export function parsePayfastForm(rawBody: string): PayFastFields {
  const posted: PayFastFields = {};
  const params = new URLSearchParams(rawBody);
  for (const [key, value] of params.entries()) {
    posted[key] = value;
  }
  return posted;
}

export async function confirmPayfastServerValidation(input: {
  mode: PayFastMode;
  posted: PayFastFields;
  fetchImpl?: typeof fetch;
}): Promise<boolean> {
  const fetchFn = input.fetchImpl ?? fetch;
  try {
    const response = await fetchFn(payfastValidateUrl(input.mode), {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: payfastParamStringUntilSignature(input.posted),
    });
    const text = (await response.text()).trim().toUpperCase();
    return text === "VALID";
  } catch {
    return false;
  }
}

function clip(value: string, max: number): string {
  return value.trim().slice(0, max);
}

function splitName(fullName: string | undefined): { first: string; last: string } {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { first: "", last: "" };
  }
  if (parts.length === 1) {
    return { first: clip(parts[0]!, 100), last: "" };
  }
  return { first: clip(parts[0]!, 100), last: clip(parts.slice(1).join(" "), 100) };
}

export function buildPayfastCheckoutFields(input: {
  merchantId: string;
  merchantKey: string;
  returnUrl: string;
  cancelUrl: string;
  notifyUrl: string;
  email: string;
  customerName?: string;
  reference: string;
  amountMinor: number;
  itemName: string;
  workspaceId?: string;
  planId?: string;
  paymentId?: string;
}): PayFastFields {
  const names = splitName(input.customerName);
  const fields: PayFastFields = {
    merchant_id: input.merchantId.trim(),
    merchant_key: input.merchantKey.trim(),
    return_url: input.returnUrl,
    cancel_url: input.cancelUrl,
    notify_url: input.notifyUrl,
    email_address: clip(input.email, 100),
    m_payment_id: clip(input.reference, 100),
    amount: amountMinorToPayfast(input.amountMinor),
    item_name: clip(input.itemName || "Ad Credits", 100),
  };
  if (names.first) {
    fields.name_first = names.first;
  }
  if (names.last) {
    fields.name_last = names.last;
  }
  if (input.workspaceId) {
    fields.custom_str1 = clip(input.workspaceId, 255);
  }
  if (input.planId) {
    fields.custom_str2 = clip(input.planId, 255);
  }
  if (input.paymentId) {
    fields.custom_str3 = clip(input.paymentId, 255);
  }
  return fields;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function payfastCheckoutHtml(input: { action: string; fields: PayFastFields; signature: string }): string {
  const rows = Object.entries(input.fields)
    .filter(([, value]) => value.trim() !== "")
    .map(([key, value]) => `<input type="hidden" name="${escapeHtml(key)}" value="${escapeHtml(value)}">`)
    .join("\n");
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Continue to payment</title>
  <style>
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #05070F; color: #F4F6FB; font-family: ui-sans-serif, system-ui, sans-serif; }
    p { color: #9AA3B8; }
    button { background: #1678FF; color: #001038; border: 0; border-radius: 0.75rem; padding: 0.75rem 1.25rem; font: inherit; cursor: pointer; }
  </style>
</head>
<body>
  <form id="payfast" action="${escapeHtml(input.action)}" method="post">
    ${rows}
    <input type="hidden" name="signature" value="${escapeHtml(input.signature)}">
    <p>Continue to payment to buy your credits.</p>
    <button type="submit">Continue to payment</button>
  </form>
  <script>document.getElementById("payfast").submit();</script>
</body>
</html>`;
}

export function payfastItnToWebhookEvent(posted: PayFastFields): ParsedWebhookEvent {
  if (posted.payment_status !== "COMPLETE") {
    return { event: "payfast.ignored", data: { status: posted.payment_status ?? "" } };
  }
  const amount = payfastAmountToMinor(posted.amount_gross ?? "");
  const pfId = posted.pf_payment_id?.trim();
  return {
    event: "charge.success",
    data: {
      id: pfId,
      status: "success",
      reference: posted.m_payment_id ?? "",
      amount: amount ?? undefined,
      currency: PAYFAST_CURRENCY,
      metadata: {
        workspaceId: posted.custom_str1,
        planId: posted.custom_str2,
        paymentId: posted.custom_str3,
      },
      authorization: {},
      customer: { email: posted.email_address },
      subscription: posted.token
        ? {
            subscription_code: posted.token,
            current_period_start: posted.billing_date,
          }
        : {},
    },
  };
}

export type PayFastProviderOptions = {
  merchantId: string;
  merchantKey?: string;
  passphrase?: string | null;
  mode: PayFastMode;
  appUrl: string;
};

export function createPayfastProvider(options: PayFastProviderOptions): PaymentProvider {
  const passphrase = options.passphrase?.trim() || null;
  const appUrl = options.appUrl.replace(/\/$/, "");

  return {
    async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
      if (input.currency.trim().toUpperCase() !== PAYFAST_CURRENCY) {
        throw new PaymentError("CURRENCY_MISMATCH", CHECKOUT_CURRENCY);
      }
      if (!Number.isFinite(input.amountMinor) || input.amountMinor < PAYFAST_MIN_AMOUNT_MINOR) {
        throw new PaymentError("AMOUNT_MISMATCH", CHECKOUT_AMOUNT);
      }
      const start = new URL(`${appUrl}/api/billing/payfast/start`);
      start.searchParams.set("reference", input.reference);
      return {
        authorizationUrl: start.toString(),
        accessCode: "payfast",
        reference: input.reference,
      };
    },

    async verifyPayment(reference: string): Promise<VerifiedPayment> {
      return {
        status: "pending",
        reference,
        amountMinor: 0,
        currency: PAYFAST_CURRENCY,
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
      const posted = parsePayfastForm(request.rawBody);
      if (!verifyPayfastItnSignature(posted, passphrase)) {
        throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
      }
      if (posted.merchant_id && posted.merchant_id.trim() !== options.merchantId.trim()) {
        throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
      }
      return payfastItnToWebhookEvent(posted);
    },
  };
}

