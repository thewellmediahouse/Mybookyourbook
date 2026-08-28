import { fulfillVerifiedCharge } from "./fulfill";
import type { ChargeSnapshot } from "./fulfill";
import type { Db } from "@/lib/db/client";
import {
  PaymentError,
  payoneerChargeToWebhookEvent,
  rapydPaymentToWebhookEvent,
} from "@/lib/providers/payments";
import type { ParsedWebhookEvent, PaymentProvider, PayoneerChargeView, RapydPaymentView } from "@/lib/providers/payments";
import { getPaymentByReference } from "./queries";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseMetadata(raw: unknown): ChargeSnapshot["metadata"] {
  let record: Record<string, unknown> = {};
  if (typeof raw === "string") {
    try {
      record = asRecord(JSON.parse(raw) as unknown);
    } catch {
      record = {};
    }
  } else {
    record = asRecord(raw);
  }
  return {
    workspaceId: readString(record.workspaceId),
    planId: readString(record.planId),
    paymentId: readString(record.paymentId),
  };
}

export function chargeSnapshotFromWebhook(
  parsed: ParsedWebhookEvent,
  provider = "paystack",
): ChargeSnapshot | null {
  if (parsed.event !== "charge.success") {
    return null;
  }
  const data = parsed.data;
  const reference = readString(data.reference);
  const amount = readNumber(data.amount);
  const currency = readString(data.currency);
  const status = readString(data.status);
  if (!reference || amount == null || !currency || status !== "success") {
    return null;
  }
  const authorization = asRecord(data.authorization);
  const customer = asRecord(data.customer);
  const subscription = asRecord(data.subscription);
  const eventId =
    data.id != null
      ? `charge.success:${String(data.id)}`
      : `charge.success:${reference}`;

  const periodStartRaw = readString(subscription.current_period_start) ?? readString(data.paid_at);
  const periodEndRaw = readString(subscription.next_payment_date);

  return {
    provider,
    eventId,
    eventType: parsed.event,
    reference,
    amountMinor: amount,
    currency,
    status: "success",
    metadata: parseMetadata(data.metadata),
    last4: readString(authorization.last4),
    brand: readString(authorization.brand),
    subscription: readString(subscription.subscription_code)
      ? {
          providerSubscriptionId: readString(subscription.subscription_code) as string,
          providerCustomerId: readString(customer.customer_code),
          emailToken: readString(subscription.email_token),
          periodStart: periodStartRaw ? new Date(periodStartRaw) : undefined,
          periodEnd: periodEndRaw ? new Date(periodEndRaw) : undefined,
        }
      : undefined,
    payloadJson: JSON.stringify({ event: parsed.event, reference }),
  };
}

async function attachStoredPaymentMetadata(db: Db, snapshot: ChargeSnapshot) {
  const storedPayment = await getPaymentByReference(db, snapshot.provider, snapshot.reference);
  const stored = parseMetadata(storedPayment?.metadataJson);
  snapshot.metadata = {
    workspaceId: storedPayment?.workspaceId ?? stored.workspaceId ?? snapshot.metadata.workspaceId,
    planId: stored.planId ?? snapshot.metadata.planId,
    paymentId: storedPayment?.id ?? stored.paymentId ?? snapshot.metadata.paymentId,
  };
}

export function requireChargeSnapshot(parsed: ParsedWebhookEvent, provider = "paystack"): ChargeSnapshot {
  const snapshot = chargeSnapshotFromWebhook(parsed, provider);
  if (!snapshot) {
    throw new PaymentError("PROVIDER", "That payment event cannot add credits.");
  }
  return snapshot;
}

export async function processSignedPaystackWebhook(
  db: Db,
  input: { rawBody: string; signature: string | null; provider: PaymentProvider },
) {
  const parsed = input.provider.handleWebhook({
    rawBody: input.rawBody,
    signature: input.signature,
  });
  const snapshot = chargeSnapshotFromWebhook(parsed);
  if (!snapshot) {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const result = await fulfillVerifiedCharge(db, snapshot);
  return { httpStatus: 200 as const, ...result };
}

export async function processSignedPayfastItn(
  db: Db,
  input: {
    rawBody: string;
    provider: PaymentProvider;
    merchantId: string;
    postedMerchantId?: string;
    confirm: () => Promise<boolean>;
  },
) {
  const parsed = input.provider.handleWebhook({
    rawBody: input.rawBody,
    signature: null,
  });
  const postedMerchantId = input.postedMerchantId?.trim();
  if (postedMerchantId && postedMerchantId !== input.merchantId.trim()) {
    throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
  }
  if (parsed.event !== "charge.success") {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const confirmed = await input.confirm();
  if (!confirmed) {
    throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
  }
  const snapshot = chargeSnapshotFromWebhook(parsed, "payfast");
  if (!snapshot) {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const result = await fulfillVerifiedCharge(db, snapshot);
  return { httpStatus: 200 as const, ...result };
}

export async function processPayoneerNotification(
  db: Db,
  input: {
    rawBody: string;
    provider: PaymentProvider;
    confirm: (longId: string) => Promise<PayoneerChargeView | null>;
  },
) {
  const parsed = input.provider.handleWebhook({
    rawBody: input.rawBody,
    signature: null,
  });
  if (parsed.event !== "payoneer.notification") {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const longId = typeof parsed.data.id === "string" ? parsed.data.id : "";
  if (!longId) {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const charge = await input.confirm(longId);
  if (!charge || charge.statusCode !== "charged") {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const mapped = payoneerChargeToWebhookEvent(charge);
  const snapshot = chargeSnapshotFromWebhook(mapped, "payoneer");
  if (!snapshot) {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  await attachStoredPaymentMetadata(db, snapshot);
  const result = await fulfillVerifiedCharge(db, snapshot);
  return { httpStatus: 200 as const, ...result };
}

export async function processRapydNotification(
  db: Db,
  input: {
    rawBody: string;
    signatureOk: boolean;
    provider: PaymentProvider;
    confirm: (paymentId: string) => Promise<RapydPaymentView | null>;
  },
) {
  if (!input.signatureOk) {
    throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
  }
  const parsed = input.provider.handleWebhook({
    rawBody: input.rawBody,
    signature: null,
  });
  if (parsed.event !== "rapyd.notification") {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const paymentId = typeof parsed.data.id === "string" ? parsed.data.id : "";
  if (!paymentId) {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const confirmed = await input.confirm(paymentId);
  if (!confirmed || confirmed.status !== "CLO" || !confirmed.paid) {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  const mapped = rapydPaymentToWebhookEvent(confirmed);
  const snapshot = chargeSnapshotFromWebhook(mapped, "rapyd");
  if (!snapshot) {
    return { httpStatus: 200 as const, granted: false, alreadyProcessed: false };
  }
  await attachStoredPaymentMetadata(db, snapshot);
  snapshot.last4 = confirmed.last4;
  snapshot.brand = confirmed.brand;
  const result = await fulfillVerifiedCharge(db, snapshot);
  return { httpStatus: 200 as const, ...result };
}
