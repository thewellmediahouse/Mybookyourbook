export type PaymentErrorCode =
  | "NOT_CONNECTED"
  | "INVALID_PLAN"
  | "CUSTOM_PLAN"
  | "MONTHLY_UNAVAILABLE"
  | "NO_SUBSCRIPTION"
  | "AMOUNT_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "INVALID_SIGNATURE"
  | "PROVIDER";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;

  constructor(code: PaymentErrorCode, message: string) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
  }
}
