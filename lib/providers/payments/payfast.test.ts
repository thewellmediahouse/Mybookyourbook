import { test } from "node:test";
import assert from "node:assert/strict";
import {
  amountsMatchMinor,
  confirmPayfastServerValidation,
  createPayfastProvider,
  formatPayfastAmount,
  generatePayfastCheckoutSignature,
  md5Hex,
  payfastUrlEncode,
  sanitizePayfastPayload,
  verifyPayfastItnSignature,
} from "./payfast";
import { PaymentError } from "./errors";

test("PayFast encoding and checkout signature follow official attribute order", () => {
  assert.equal(md5Hex(""), "d41d8cd98f00b204e9800998ecf8427e");
  assert.equal(md5Hex("hello"), "5d41402abc4b2a76b9719d911017c592");
  assert.equal(payfastUrlEncode("http://example.com/a b"), "http%3A%2F%2Fexample.com%2Fa+b");
  assert.equal(formatPayfastAmount(599), "599.00");
  assert.equal(formatPayfastAmount(150.5), "150.50");

  const fields = {
    merchant_id: "10000100",
    merchant_key: "46f0cd694581a",
    return_url: "https://example.com/return",
    cancel_url: "https://example.com/cancel",
    notify_url: "https://example.com/notify",
    name_first: "Test",
    name_last: "User",
    email_address: "test@example.com",
    m_payment_id: "cy.test-1",
    amount: "599.00",
    item_name: "First Commercial",
  };
  const sig = generatePayfastCheckoutSignature(fields, "jt7NOE43FZPn");
  assert.match(sig, /^[a-f0-9]{32}$/);
  assert.equal(generatePayfastCheckoutSignature(fields, "jt7NOE43FZPn"), sig);
  assert.notEqual(generatePayfastCheckoutSignature(fields, "wrong"), sig);
});

test("PayFast ITN signature uses posted order and optional passphrase", () => {
  const posted = {
    m_payment_id: "cy.test-1",
    pf_payment_id: "123456",
    payment_status: "COMPLETE",
    amount_gross: "599.00",
    amount_fee: "13.77",
    amount_net: "585.23",
  };
  const pairs = Object.entries(posted).map(([key, value]) => `${key}=${payfastUrlEncode(value)}`);
  const signature = md5Hex(`${pairs.join("&")}&passphrase=${payfastUrlEncode("secret")}`);
  const withSig = { ...posted, signature };
  assert.equal(verifyPayfastItnSignature(withSig, "secret"), true);
  assert.equal(verifyPayfastItnSignature(withSig, "wrong"), false);
  assert.equal(amountsMatchMinor(59900, "599.00"), true);
  assert.equal(amountsMatchMinor(59900, "599.02"), false);
  const safe = sanitizePayfastPayload({
    m_payment_id: "x",
    signature: "abc",
    merchant_key: "secret",
    amount_gross: "10.00",
  });
  assert.equal(safe.signature, undefined);
  assert.equal(safe.merchant_key, undefined);
  assert.equal(safe.amount_gross, "10.00");
});

test("PayFast checkout refuses non-ZAR and live HTTP is not used by the form builder", async () => {
  const original = globalThis.fetch;
  let called = 0;
  globalThis.fetch = (async () => {
    called += 1;
    throw new Error("PayFast process is a form POST, not fetch");
  }) as typeof fetch;
  try {
    const provider = createPayfastProvider({
      merchantId: "10000100",
      merchantKey: "46f0cd694581a",
      passphrase: "secret",
      mode: "sandbox",
      appUrl: "https://example.com",
    });
    await assert.rejects(
      () =>
        provider.createCheckout({
          email: "owner@example.com",
          amountMinor: 79900,
          currency: "USD",
          reference: "cy.int",
          callbackUrl: "https://example.com/dashboard/billing",
          metadata: {},
        }),
      (error: unknown) => error instanceof PaymentError && error.code === "CURRENCY_MISMATCH",
    );
    const checkout = await provider.createCheckout({
      email: "owner@example.com",
      amountMinor: 79900,
      currency: "ZAR",
      reference: "cy.za",
      callbackUrl: "https://example.com/dashboard/billing",
      metadata: {},
    });
    assert.match(checkout.authorizationUrl, /\/api\/billing\/payfast\/start\?reference=cy\.za/);
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("PayFast server confirmation requires VALID", async () => {
  const posted = { m_payment_id: "cy.1", pf_payment_id: "9", payment_status: "COMPLETE" };
  const ok = await confirmPayfastServerValidation({
    mode: "sandbox",
    posted,
    fetchImpl: (async () => new Response("VALID")) as typeof fetch,
  });
  const bad = await confirmPayfastServerValidation({
    mode: "sandbox",
    posted,
    fetchImpl: (async () => new Response("INVALID")) as typeof fetch,
  });
  assert.equal(ok, true);
  assert.equal(bad, false);
});
