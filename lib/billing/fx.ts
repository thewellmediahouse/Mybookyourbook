import { PaymentError } from "@/lib/providers/payments";
import { PAYFAST_MIN_AMOUNT_MINOR } from "@/lib/providers/payments/payfast";
import { CHECKOUT_CURRENCY_UNSUPPORTED } from "./copy";

/** Locked commercial conversion for PayFast settlement. Not a live market quote. */
export const DEFAULT_PAYFAST_USD_ZAR_RATE = 18.5;

export function parseUsdZarRate(raw?: string): number {
  if (!raw?.trim()) {
    return DEFAULT_PAYFAST_USD_ZAR_RATE;
  }
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 5 || value > 50) {
    throw new PaymentError("CURRENCY_MISMATCH", "The dollar-to-rand rate is not set correctly.");
  }
  return value;
}

export function usdToZarMinor(usdMinor: number, rate: number): number {
  if (!Number.isFinite(usdMinor) || usdMinor < 0 || !Number.isFinite(rate) || rate <= 0) {
    throw new PaymentError("AMOUNT_MISMATCH", "That amount cannot be converted for card payment.");
  }
  return Math.round(usdMinor * rate);
}

export type PayfastSettlement = {
  currency: "ZAR";
  amountMinor: number;
  catalogCurrency: string;
  catalogAmountMinor: number;
  rate: number | null;
};

export function settlePayfastCharge(
  plan: { currency: string; amountMinor: number },
  rate: number,
): PayfastSettlement {
  const catalogCurrency = plan.currency.trim().toUpperCase();
  if (catalogCurrency === "ZAR") {
    return {
      currency: "ZAR",
      amountMinor: plan.amountMinor,
      catalogCurrency,
      catalogAmountMinor: plan.amountMinor,
      rate: null,
    };
  }
  if (catalogCurrency !== "USD") {
    throw new PaymentError("CURRENCY_MISMATCH", CHECKOUT_CURRENCY_UNSUPPORTED);
  }
  const amountMinor = usdToZarMinor(plan.amountMinor, rate);
  if (amountMinor < PAYFAST_MIN_AMOUNT_MINOR) {
    throw new PaymentError("AMOUNT_MISMATCH", "That amount is below the minimum card payment.");
  }
  return {
    currency: "ZAR",
    amountMinor,
    catalogCurrency,
    catalogAmountMinor: plan.amountMinor,
    rate,
  };
}
