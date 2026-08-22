import { PaymentError } from "./errors";
import { verifyPaystackSignature } from "./signature";
import type {
  CancelSubscriptionInput,
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  PaymentCheckoutInput,
  PaymentCheckoutResult,
  PaymentProvider,
  ParsedWebhookEvent,
  VerifiedPayment,
  VerifiedPaymentStatus,
  WebhookRequest,
} from "./types";

const PAYSTACK_API = "https://api.paystack.co";

type PaystackJson = {
  status?: boolean;
  message?: string;
  data?: unknown;
};

async function paystackRequest(secret: string, path: string, init?: RequestInit): Promise<PaystackJson> {
  let response: Response;
  try {
    response = await fetch(`${PAYSTACK_API}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${secret}`,
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    throw new PaymentError("PROVIDER", "We couldn't reach the payment provider. Try again.");
  }
  let json: PaystackJson;
  try {
    json = (await response.json()) as PaystackJson;
  } catch {
    throw new PaymentError("PROVIDER", "We couldn't complete that payment step. Try again.");
  }
  if (!response.ok || json.status !== true) {
    throw new PaymentError("PROVIDER", "We couldn't complete that payment step. Try again.");
  }
  return json;
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

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) {
    return {};
  }
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) {
      return {};
    }
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return asRecord(parsed);
    } catch {
      return {};
    }
  }
  return asRecord(raw);
}

function mapVerifyStatus(status: string | undefined): VerifiedPaymentStatus {
  if (status === "success") {
    return "success";
  }
  if (status === "failed") {
    return "failed";
  }
  if (status === "abandoned") {
    return "abandoned";
  }
  return "pending";
}

function parseWebhookJson(rawBody: string): ParsedWebhookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
  }
  const record = asRecord(parsed);
  const event = readString(record.event) ?? "";
  return { event, data: asRecord(record.data) };
}

export function createPaystackProvider(secret: string): PaymentProvider {
  return {
    async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
      const body: Record<string, unknown> = {
        email: input.email,
        amount: String(input.amountMinor),
        currency: input.currency,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: JSON.stringify(input.metadata),
      };
      if (input.providerPlanCode) {
        body.plan = input.providerPlanCode;
      }
      const json = await paystackRequest(secret, "/transaction/initialize", {
        method: "POST",
        body: JSON.stringify(body),
      });
      const data = asRecord(json.data);
      const authorizationUrl = readString(data.authorization_url);
      const accessCode = readString(data.access_code);
      const reference = readString(data.reference) ?? input.reference;
      if (!authorizationUrl || !accessCode) {
        throw new PaymentError("PROVIDER", "We couldn't start checkout. Try again.");
      }
      return { authorizationUrl, accessCode, reference };
    },

    async verifyPayment(reference: string): Promise<VerifiedPayment> {
      const json = await paystackRequest(secret, `/transaction/verify/${encodeURIComponent(reference)}`);
      const data = asRecord(json.data);
      const authorization = asRecord(data.authorization);
      const customer = asRecord(data.customer);
      const amount = readNumber(data.amount);
      const currency = readString(data.currency);
      const ref = readString(data.reference) ?? reference;
      if (amount == null || !currency) {
        throw new PaymentError("PROVIDER", "We couldn't confirm that payment. Try again.");
      }
      const transactionId = data.id;
      return {
        status: mapVerifyStatus(readString(data.status)),
        reference: ref,
        amountMinor: amount,
        currency,
        metadata: parseMetadata(data.metadata),
        customerEmail: readString(customer.email),
        authorizationLast4: readString(authorization.last4),
        authorizationBrand: readString(authorization.brand),
        providerTransactionId:
          typeof transactionId === "number" || typeof transactionId === "string"
            ? String(transactionId)
            : undefined,
      };
    },

    async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
      const json = await paystackRequest(secret, "/subscription", {
        method: "POST",
        body: JSON.stringify({
          customer: input.customerCode,
          plan: input.providerPlanCode,
          authorization: input.authorizationCode,
        }),
      });
      const data = asRecord(json.data);
      const code = readString(data.subscription_code);
      const customerCode = readString(asRecord(data.customer).customer_code) ?? input.customerCode;
      if (!code) {
        throw new PaymentError("PROVIDER", "We couldn't start that monthly plan. Try again.");
      }
      return {
        providerSubscriptionId: code,
        providerCustomerId: customerCode,
        emailToken: readString(data.email_token),
      };
    },

    async cancelSubscription(input: CancelSubscriptionInput): Promise<void> {
      await paystackRequest(secret, "/subscription/disable", {
        method: "POST",
        body: JSON.stringify({
          code: input.providerSubscriptionId,
          token: input.emailToken,
        }),
      });
    },

    handleWebhook(request: WebhookRequest): ParsedWebhookEvent {
      if (!verifyPaystackSignature(request.rawBody, request.signature, secret)) {
        throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
      }
      return parseWebhookJson(request.rawBody);
    },
  };
}
