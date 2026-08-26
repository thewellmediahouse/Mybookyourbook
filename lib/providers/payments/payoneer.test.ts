import { test } from "node:test";
import assert from "node:assert/strict";
import { PaymentError } from "./errors";
import {
  buildPayoneerListRequest,
  confirmPayoneerCharge,
  createPayoneerProvider,
  parsePayoneerCharge,
  payoneerAmountFromMinor,
  payoneerChargeToWebhookEvent,
  payoneerChargeUrl,
  payoneerHostedPageUrl,
  payoneerListCountry,
  payoneerListsUrl,
} from "./payoneer";

test("Payoneer LIST body uses documented fields and major-unit amounts", () => {
  const body = buildPayoneerListRequest({
    email: "owner@example.com",
    amountMinor: 79900,
    currency: "ZAR",
    reference: "cy.za-ref",
    callbackUrl: "https://example.com/dashboard/billing",
    notificationUrl: "https://example.com/api/webhooks/payoneer",
    country: "ZA",
    customerNumber: "ws_1",
  });
  assert.equal(body.transactionId, "cy.za-ref");
  assert.equal(body.country, "ZA");
  assert.equal(body.customer.number, "ws_1");
  assert.equal(body.customer.email, "owner@example.com");
  assert.equal(body.payment.amount, 799);
  assert.equal(body.payment.currency, "ZAR");
  assert.equal(body.payment.reference, "cy.za-ref");
  assert.equal(body.style.hostedVersion, "v3");
  assert.match(body.callback.returnUrl, /reference=cy\.za-ref/);
  assert.match(body.callback.cancelUrl, /cancelled=1/);
  assert.equal(body.callback.notificationUrl, "https://example.com/api/webhooks/payoneer");
  assert.equal(payoneerAmountFromMinor(4900), 49);
  assert.equal(payoneerListCountry("US", "USD"), "US");
  assert.equal(payoneerListCountry("South Africa", "ZAR"), "ZA");
});

test("Payoneer hosted page and charge URL stay on oscato hosts", () => {
  const listUrl = "https://api.sandbox.oscato.com/api/lists/list_abcdefgh";
  const hosted = payoneerHostedPageUrl("sandbox", listUrl);
  assert.equal(
    hosted,
    "https://resources.sandbox.oscato.com/paymentpage/v3/responsive.html?listUrl=https%3A%2F%2Fapi.sandbox.oscato.com%2Fapi%2Flists%2Flist_abcdefgh",
  );
  assert.equal(payoneerListsUrl("sandbox"), "https://api.sandbox.oscato.com/api/lists");
  assert.equal(payoneerListsUrl("live"), "https://api.live.oscato.com/api/lists");
  assert.equal(
    payoneerChargeUrl("sandbox", "chg_12345678"),
    "https://api.sandbox.oscato.com/api/charges/chg_12345678",
  );
});

test("Payoneer charge mapping grants only when status is charged", () => {
  const charged = parsePayoneerCharge({
    identification: { longId: "chg_12345678", transactionId: "cy.za-ref" },
    status: { code: "charged" },
    payment: { amount: 799, currency: "ZAR" },
  });
  assert.ok(charged);
  const success = payoneerChargeToWebhookEvent(charged);
  assert.equal(success.event, "charge.success");
  assert.equal(success.data.amount, 79900);
  assert.equal(success.data.currency, "ZAR");

  const pending = parsePayoneerCharge({
    identification: { longId: "chg_12345678", transactionId: "cy.za-ref" },
    status: { code: "pending" },
    payment: { amount: 799, currency: "ZAR" },
  });
  assert.ok(pending);
  assert.equal(payoneerChargeToWebhookEvent(pending).event, "payoneer.ignored");
});

test("Payoneer checkout posts LIST then redirects to hosted page; live HTTP is injectable", async () => {
  let posted = "";
  const provider = createPayoneerProvider({
    username: "merchant",
    token: "token",
    mode: "sandbox",
    appUrl: "https://example.com",
    fetchImpl: (async (url, init) => {
      posted = String(init?.body ?? "");
      assert.equal(String(url), "https://api.sandbox.oscato.com/api/lists");
      return new Response(
        JSON.stringify({ links: { self: "https://api.sandbox.oscato.com/api/lists/list_abcdefgh" } }),
        { status: 201 },
      );
    }) as typeof fetch,
  });
  const checkout = await provider.createCheckout({
    email: "owner@example.com",
    amountMinor: 4900,
    currency: "USD",
    reference: "cy.usd-ref",
    callbackUrl: "https://example.com/dashboard/billing",
    country: "US",
    metadata: { workspaceId: "ws_1", planId: "plan_1" },
  });
  assert.match(checkout.authorizationUrl, /resources\.sandbox\.oscato\.com\/paymentpage\/v3/);
  assert.match(checkout.authorizationUrl, /listUrl=/);
  const body = JSON.parse(posted) as { payment: { amount: number; currency: string }; country: string };
  assert.equal(body.payment.amount, 49);
  assert.equal(body.payment.currency, "USD");
  assert.equal(body.country, "US");

  await assert.rejects(
    () =>
      provider.createCheckout({
        email: "owner@example.com",
        amountMinor: 4900,
        currency: "EUR",
        reference: "cy.eur",
        callbackUrl: "https://example.com/dashboard/billing",
        metadata: {},
      }),
    (error: unknown) => error instanceof PaymentError && error.code === "CURRENCY_MISMATCH",
  );
});

test("Payoneer GET charge requires charged before it is trusted", async () => {
  const charged = await confirmPayoneerCharge({
    mode: "sandbox",
    username: "merchant",
    token: "token",
    longId: "chg_12345678",
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          identification: { longId: "chg_12345678", transactionId: "cy.za-ref" },
          status: { code: "charged" },
          payment: { amount: 799, currency: "ZAR" },
        }),
      )) as typeof fetch,
  });
  assert.equal(charged?.statusCode, "charged");
  assert.equal(charged?.amountMinor, 79900);

  const missing = await confirmPayoneerCharge({
    mode: "sandbox",
    username: "merchant",
    token: "token",
    longId: "chg_12345678",
    fetchImpl: (async () => new Response("", { status: 404 })) as typeof fetch,
  });
  assert.equal(missing, null);
});
