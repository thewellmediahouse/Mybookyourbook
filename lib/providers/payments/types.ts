export type PaymentCheckoutInput = {
  email: string;
  amountMinor: number;
  currency: string;
  reference: string;
  callbackUrl: string;
  metadata: Record<string, string>;
  /** Paystack plan code. Official docs: this invalidates `amount`. */
  providerPlanCode?: string;
};

export type PaymentCheckoutResult = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

export type VerifiedPaymentStatus = "success" | "failed" | "abandoned" | "pending";

export type VerifiedPayment = {
  status: VerifiedPaymentStatus;
  reference: string;
  amountMinor: number;
  currency: string;
  metadata: Record<string, unknown>;
  customerEmail?: string;
  authorizationLast4?: string;
  authorizationBrand?: string;
  providerTransactionId?: string;
};

export type CreateSubscriptionInput = {
  customerCode: string;
  providerPlanCode: string;
  authorizationCode: string;
};

export type CreateSubscriptionResult = {
  providerSubscriptionId: string;
  providerCustomerId: string;
  emailToken?: string;
};

export type CancelSubscriptionInput = {
  providerSubscriptionId: string;
  emailToken: string;
};

export type WebhookRequest = {
  rawBody: string;
  signature: string | null;
};

export type ParsedWebhookEvent = {
  event: string;
  data: Record<string, unknown>;
};

export interface PaymentProvider {
  createCheckout(input: PaymentCheckoutInput): Promise<PaymentCheckoutResult>;
  verifyPayment(reference: string): Promise<VerifiedPayment>;
  createSubscription(input: CreateSubscriptionInput): Promise<CreateSubscriptionResult>;
  cancelSubscription(input: CancelSubscriptionInput): Promise<void>;
  handleWebhook(request: WebhookRequest): ParsedWebhookEvent;
}
