import assert from "node:assert/strict";
import { test } from "node:test";
import { PaymentError } from "@/lib/providers/payments";
import { DEFAULT_PAYFAST_USD_ZAR_RATE, parseUsdZarRate, settlePayfastCharge, usdToZarMinor } from "./fx";

test("locked rate converts the $49 Single plan to rand cents", () => {
  assert.equal(parseUsdZarRate(undefined), DEFAULT_PAYFAST_USD_ZAR_RATE);
  assert.equal(usdToZarMinor(4900, 18.5), 90650);
  const settled = settlePayfastCharge({ currency: "USD", amountMinor: 4900 }, 18.5);
  assert.equal(settled.currency, "ZAR");
  assert.equal(settled.amountMinor, 90650);
  assert.equal(settled.catalogCurrency, "USD");
});

test("ZAR plans are not converted", () => {
  const settled = settlePayfastCharge({ currency: "ZAR", amountMinor: 59900 }, 18.5);
  assert.equal(settled.amountMinor, 59900);
  assert.equal(settled.rate, null);
});

test("unsupported catalog currencies stay closed", () => {
  assert.throws(
    () => settlePayfastCharge({ currency: "EUR", amountMinor: 4900 }, 18.5),
    (error: unknown) => error instanceof PaymentError && error.code === "CURRENCY_MISMATCH",
  );
});
