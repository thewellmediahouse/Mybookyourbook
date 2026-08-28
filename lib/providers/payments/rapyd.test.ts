import { test } from "node:test";
import assert from "node:assert/strict";
import { PaymentError } from "./errors";
import {
  buildRapydCheckoutRequest,
  confirmRapydPayment,
  createRapydProvider,
  parseRapydCheckout,
  parseRapydPayment,
  rapydAmountFromMinor,
  rapydApiUrl,
  rapydCountry,
  rapydPaymentToWebhookEvent,
  rapydPublicReturnUrl,
  rapydRequestSignature,
  rapydWebhookSignature,
  signaturesMatch,
  verifyRapydWebhookSignature,
} from "./rapyd";

const ACCESS = "rak_test_access";
const SECRET = "rsk_test_secret_key_value";

test("Rapyd checkout body uses documented Collect fields and major-unit amounts", () => {
  const body = buildRapydCheckoutRequest({
    email: "owner@example.com",
    amountMinor: 79900,
    currency: "ZAR",
    reference: "cy.za-ref",
    callbackUrl: "https://example.com/dashboard/billing",
    country: "ZA",
    metadata: { workspaceId: "ws_1", planId: "plan_1", paymentId: "pay_1" },
  });
  assert.equal(body.amount, 799);
  assert.equal(body.country, "ZA");
  assert.equal(body.currency, "ZAR");
  assert.equal(body.merchant_reference_id, "cy.za-ref");
  assert.equal(body.metadata.workspaceId, "ws_1");
  assert.match(body.complete_checkout_url ?? "", /reference=cy\.za-ref/);
  assert.match(body.cancel_checkout_url ?? "", /cancelled=1/);
  assert.equal(rapydAmountFromMinor(4900), 49);
  assert.equal(rapydCountry("US", "USD"), "US");
  assert.equal(rapydCountry("South Africa", "ZAR"), "ZA");
  assert.equal(rapydPublicReturnUrl("http://localhost:3000/dashboard/billing"), undefined);
});

test("Rapyd request signature matches the official Node HMAC hex-then-base64 sample", () => {
  const signature = rapydRequestSignature({
    method: "post",
    urlPath: "/v1/checkout",
    salt: "abcd1234",
    timestamp: "1700000000",
    accessKey: ACCESS,
    secretKey: SECRET,
    body: '{"amount":799,"country":"ZA","currency":"ZAR"}',
  });
  assert.equal(
    signature,
    rapydRequestSignature({
      method: "POST",
      urlPath: "/v1/checkout",
      salt: "abcd1234",
      timestamp: "1700000000",
      accessKey: ACCESS,
      secretKey: SECRET,
      body: '{"amount":799,"country":"ZA","currency":"ZAR"}',
    }),
  );
  assert.equal(signaturesMatch(signature, signature), true);
  assert.equal(signaturesMatch(signature, "aaaa"), false);
});

test("Rapyd payment mapping grants only when status is CLO and paid", () => {
  const charged = parseRapydPayment({
    status: { status: "SUCCESS" },
    data: {
      id: "payment_abc123",
      merchant_reference_id: "cy.za-ref",
      status: "CLO",
      paid: true,
      amount: 799,
      currency_code: "ZAR",
      payment_method_data: { last4: "1111", bin_details: { brand: "VISA" } },
    },
  });
  assert.ok(charged);
  const success = rapydPaymentToWebhookEvent(charged);
  assert.equal(success.event, "charge.success");
  assert.equal(success.data.amount, 79900);
  assert.equal(success.data.currency, "ZAR");

  const pending = parseRapydPayment({
    status: { status: "SUCCESS" },
    data: {
      id: "payment_abc123",
      merchant_reference_id: "cy.za-ref",
      status: "ACT",
      paid: false,
      amount: 799,
      currency_code: "ZAR",
    },
  });
  assert.ok(pending);
  assert.equal(rapydPaymentToWebhookEvent(pending).event, "rapyd.ignored");
});

test("Rapyd webhook signature uses the full configured URL and compact body", () => {
  const body = '{"id":"wh_1","type":"PAYMENT_COMPLETED","data":{"id":"payment_abc123"}}';
  const salt = "s1";
  const timestamp = "1700000000";
  const webhookUrl = "https://example.com/api/webhooks/rapyd";
  const signature = rapydWebhookSignature({
    webhookUrl,
    salt,
    timestamp,
    accessKey: ACCESS,
    secretKey: SECRET,
    body,
  });
  assert.equal(
    verifyRapydWebhookSignature({
      webhookUrl,
      accessKey: ACCESS,
      secretKey: SECRET,
      rawBody: body,
      salt,
      timestamp,
      signature,
    }),
    true,
  );
  assert.equal(
    verifyRapydWebhookSignature({
      webhookUrl,
      accessKey: ACCESS,
      secretKey: SECRET,
      rawBody: body,
      salt,
      timestamp,
      signature: "nope",
    }),
    false,
  );
});

test("Rapyd checkout posts Create Checkout Page then returns redirect_url; live HTTP is injectable", async () => {
  const calls: { url: string; method: string; body: string; pathHeader: string }[] = [];
  const provider = createRapydProvider({
    accessKey: ACCESS,
    secretKey: SECRET,
    mode: "sandbox",
    appUrl: "https://example.com",
    fetchImpl: async (input, init) => {
      const url = String(input);
      const body = typeof init?.body === "string" ? init.body : "";
      calls.push({
        url,
        method: String(init?.method),
        body,
        pathHeader: "",
      });
      return new Response(
        JSON.stringify({
          status: { status: "SUCCESS" },
          data: {
            id: "checkout_abc123def",
            redirect_url: "https://sandboxcheckout.rapyd.net/?token=checkout_abc123def",
          },
        }),
        { status: 200 },
      );
    },
  });
  const checkout = await provider.createCheckout({
    email: "owner@example.com",
    amountMinor: 59900,
    currency: "ZAR",
    reference: "cy.ref",
    callbackUrl: "https://example.com/dashboard/billing",
    metadata: { workspaceId: "ws", planId: "plan", paymentId: "pay" },
    country: "ZA",
  });
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, rapydApiUrl("sandbox", "/v1/checkout"));
  assert.equal(calls[0]?.method, "POST");
  const posted = JSON.parse(calls[0]?.body ?? "{}") as { amount: number; currency: string };
  assert.equal(posted.amount, 599);
  assert.equal(posted.currency, "ZAR");
  assert.equal(checkout.authorizationUrl, "https://sandboxcheckout.rapyd.net/?token=checkout_abc123def");
  assert.equal(checkout.accessCode, "checkout_abc123def");
});

test("Rapyd confirm retrieves the payment and rejects a bad payment id", async () => {
  await assert.rejects(
    () =>
      confirmRapydPayment({
        mode: "sandbox",
        accessKey: ACCESS,
        secretKey: SECRET,
        paymentId: "../evil",
      }),
    PaymentError,
  );
  const view = await confirmRapydPayment({
    mode: "sandbox",
    accessKey: ACCESS,
    secretKey: SECRET,
    paymentId: "payment_abc123",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({
          status: { status: "SUCCESS" },
          data: {
            id: "payment_abc123",
            merchant_reference_id: "cy.ref",
            status: "CLO",
            paid: true,
            amount: 5.99,
            currency_code: "USD",
          },
        }),
        { status: 200 },
      ),
  });
  assert.equal(view?.amountMinor, 599);
  assert.equal(view?.paid, true);
});

test("Rapyd checkout parser requires SUCCESS envelope and checkout_ id", () => {
  assert.equal(
    parseRapydCheckout({
      status: { status: "ERROR" },
      data: { id: "checkout_abc", redirect_url: "https://sandboxcheckout.rapyd.net/?token=x" },
    }),
    null,
  );
});

test("Rapyd webhook treats PAYMENT_SUCCEEDED as a retrieve trigger, not a grant", () => {
  const provider = createRapydProvider({
    accessKey: ACCESS,
    secretKey: SECRET,
    mode: "sandbox",
    appUrl: "https://example.com",
  });
  const completed = provider.handleWebhook({
    rawBody: JSON.stringify({
      id: "wh_1",
      type: "PAYMENT_SUCCEEDED",
      data: { id: "payment_abc123" },
    }),
    signature: null,
  });
  assert.equal(completed.event, "rapyd.notification");
  assert.equal(completed.data.id, "payment_abc123");
  const ignored = provider.handleWebhook({
    rawBody: JSON.stringify({ id: "wh_2", type: "PAYMENT_FAILED", data: { id: "payment_abc123" } }),
    signature: null,
  });
  assert.equal(ignored.event, "rapyd.ignored");
});
