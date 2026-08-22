import { PaymentError } from "./errors";
import { verifyPaystackSignature } from "./signature";
import type {
  CreateSubscriptionInput,
  CreateSubscriptionResult,
  PaymentCheckoutInput,
  PaymentCheckoutResult,
  PaymentProvider,
  ParsedWebhookEvent,
  VerifiedPayment,
  WebhookRequest,
} from "./types";

function parseWebhookJson(rawBody: string): ParsedWebhookEvent {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody) as unknown;
  } catch {
    throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
  }
  if (!parsed || typeof parsed !== "object") {
    throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
  }
  const record = parsed as Record<string, unknown>;
  const event = typeof record.event === "string" ? record.event : "";
  const data =
    record.data && typeof record.data === "object" ? (record.data as Record<string, unknown>) : {};
  return { event, data };
}

export function createMockPaymentProvider(options?: { appUrl?: string; webhookSecret?: string }): PaymentProvider {
  const appUrl = (options?.appUrl ?? "http://localhost:3000").replace(/\/$/, "");
  const webhookSecret = options?.webhookSecret;

  return {
    async createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult> {
      const callback = new URL(input.callbackUrl || `${appUrl}/dashboard/billing`);
      callback.searchParams.set("reference", input.reference);
      return {
        authorizationUrl: callback.toString(),
        accessCode: "mock",
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

    async createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult> {
      return {
        providerSubscriptionId: `sub_mock_${input.providerPlanCode}`,
        providerCustomerId: input.customerCode || "cus_mock",
        emailToken: "mock_email_token",
      };
    },

    async cancelSubscription(): Promise<void> {
      return;
    },

    handleWebhook(request: WebhookRequest): ParsedWebhookEvent {
      if (!webhookSecret || !verifyPaystackSignature(request.rawBody, request.signature, webhookSecret)) {
        throw new PaymentError("INVALID_SIGNATURE", "We couldn't confirm that payment event.");
      }
      return parseWebhookJson(request.rawBody);
    },
  };
}
