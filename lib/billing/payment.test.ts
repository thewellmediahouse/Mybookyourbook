import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "@/lib/db/client";
import { creditTransactions, profiles, subscriptions, user } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { getWalletBalance } from "@/lib/credits/ledger";
import { eq } from "drizzle-orm";
import { startCheckout } from "./checkout";
import { insertTestPlan } from "./plans";
import { inspectCheckoutRedirect } from "./redirect";
import { processPayoneerNotification, processRapydNotification, processSignedPayfastItn, processSignedPaystackWebhook } from "./webhook";
import { fulfillVerifiedCharge } from "./fulfill";
import { getActiveSubscription } from "./queries";
import {
  createMockPaymentProvider,
  createPayfastProvider,
  createPayoneerProvider,
  createRapydProvider,
  getPaymentsSetup,
  md5Hex,
  payfastUrlEncode,
  signPaystackBody,
  verifyPaystackSignature,
} from "@/lib/providers/payments";

async function insertPerson(db: ReturnType<typeof createDb>, email: string, name: string) {
  const id = newId();
  const now = new Date();
  await db.insert(user).values({
    id,
    name,
    email,
    emailVerified: true,
    firstName: name.split(" ")[0],
    lastName: name.split(" ").slice(1).join(" ") || name,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(profiles).values({
    userId: id,
    firstName: name.split(" ")[0] ?? "Test",
    lastName: name.split(" ").slice(1).join(" ") || "User",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

async function openStudio(db: ReturnType<typeof createDb>, stamp: number) {
  const owner = await insertPerson(db, `phase14.${stamp}@cineyou.test`, "Owner Fourteen");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Fourteen ${stamp}`,
    type: "BUSINESS",
    country: "ZA",
    business: { name: `Billing Brand ${stamp}` },
  });
  return { owner, studio };
}

function chargeBody(input: {
  id: number;
  reference: string;
  amount: number;
  currency: string;
  workspaceId: string;
  planId: string;
}) {
  return JSON.stringify({
    event: "charge.success",
    data: {
      id: input.id,
      status: "success",
      reference: input.reference,
      amount: input.amount,
      currency: input.currency,
      metadata: {
        workspaceId: input.workspaceId,
        planId: input.planId,
      },
    },
  });
}

test("Paystack webhook signature is HMAC-SHA512 of the raw body", () => {
  const secret = "sk_test_signature";
  const body = '{"event":"charge.success","data":{"reference":"abc"}}';
  const signature = signPaystackBody(body, secret);
  assert.equal(verifyPaystackSignature(body, signature, secret), true);
  assert.equal(verifyPaystackSignature(body, "deadbeef", secret), false);
});

test("payment mode never uses live Rapyd or Payoneer in test, and live does not silently mock", () => {
  assert.deepEqual(getPaymentsSetup({ PAYMENTS_MODE: "test" }).adapter, "mock");
  assert.equal(getPaymentsSetup({ PAYMENTS_MODE: "test" }).checkoutAvailable, true);
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      RAPYD_MODE: "live",
      RAPYD_ACCESS_KEY: "rak_live_must_not_run",
      RAPYD_SECRET_KEY: "rsk_live_must_not_run_value",
    }).checkoutAvailable,
    false,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      RAPYD_ACCESS_KEY: "rak_sandbox",
      RAPYD_SECRET_KEY: "rsk_sandbox_secret",
    }).checkoutAvailable,
    false,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      RAPYD_MODE: "sandbox",
      RAPYD_ACCESS_KEY: "rak_sandbox",
      RAPYD_SECRET_KEY: "rsk_sandbox_secret",
    }).adapter,
    "rapyd",
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      RAPYD_MODE: "sandbox",
    }).checkoutAvailable,
    false,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      PAYONEER_MODE: "sandbox",
    }).checkoutAvailable,
    false,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      PAYONEER_MODE: "live",
      PAYONEER_USERNAME: "merchant",
      PAYONEER_TOKEN: "live-token-must-not-run",
    }).checkoutAvailable,
    false,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      PAYONEER_USERNAME: "merchant",
      PAYONEER_TOKEN: "sandbox-token",
    }).checkoutAvailable,
    false,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      PAYONEER_MODE: "sandbox",
      PAYONEER_USERNAME: "merchant",
      PAYONEER_TOKEN: "sandbox-token",
    }).adapter,
    "payoneer",
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "test",
      PAYFAST_MODE: "sandbox",
      PAYFAST_MERCHANT_ID: "10000100",
      PAYFAST_MERCHANT_KEY: "46f0cd694581a",
    }).adapter,
    "mock",
  );
  assert.equal(getPaymentsSetup({ PAYMENTS_MODE: "live" }).checkoutAvailable, false);
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "live",
      PAYONEER_MODE: "sandbox",
      PAYONEER_USERNAME: "merchant",
      PAYONEER_TOKEN: "sandbox-token",
    }).checkoutAvailable,
    false,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "live",
      PAYONEER_MODE: "live",
      PAYONEER_USERNAME: "merchant",
      PAYONEER_TOKEN: "live-token-must-not-run",
    }).checkoutAvailable,
    true,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "live",
      RAPYD_MODE: "sandbox",
      RAPYD_ACCESS_KEY: "rak_sandbox",
      RAPYD_SECRET_KEY: "rsk_sandbox_secret",
    }).checkoutAvailable,
    false,
  );
  assert.equal(
    getPaymentsSetup({
      PAYMENTS_MODE: "live",
      RAPYD_MODE: "live",
      RAPYD_ACCESS_KEY: "rak_live_must_not_run",
      RAPYD_SECRET_KEY: "rsk_live_must_not_run_value",
    }).adapter,
    "rapyd",
  );
});

test("frontend redirect cannot grant credits; verified payment grants the package once", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now();
  const { studio } = await openStudio(db, stamp);
  const plan = await insertTestPlan(db, {
    id: `plan_za_first_${stamp}`,
    code: `first_${stamp}`,
    name: "First Commercial",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 59900,
    credits: 1,
    interval: "one_time",
    metadataJson: '{"introductory":true}',
  });
  const secret = `whsec_${stamp}`;
  const provider = createMockPaymentProvider({ webhookSecret: secret });
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "http://localhost:3000/dashboard/billing",
    provider,
  });
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const redirect = await inspectCheckoutRedirect(db, {
    reference: checkout.reference,
    success: "true",
    trxref: checkout.reference,
  });
  assert.equal(redirect.granted, false);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const rawBody = chargeBody({
    id: stamp,
    reference: checkout.reference,
    amount: 59900,
    currency: "ZAR",
    workspaceId: studio.workspaceId,
    planId: plan.id,
  });
  const first = await processSignedPaystackWebhook(db, {
    rawBody,
    signature: signPaystackBody(rawBody, secret),
    provider,
  });
  assert.equal(first.granted, true);
  assert.equal(first.credits, 1);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  const duplicate = await processSignedPaystackWebhook(db, {
    rawBody,
    signature: signPaystackBody(rawBody, secret),
    provider,
  });
  assert.equal(duplicate.granted, false);
  assert.equal(duplicate.alreadyProcessed, true);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  const [ledger] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.workspaceId, studio.workspaceId));
  assert.equal(ledger?.type, "PURCHASE");
  assert.equal(ledger?.amount, 1);
});

test("wrong amount and wrong currency are rejected and do not grant credits", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 3;
  const { studio } = await openStudio(db, stamp);
  const plan = await insertTestPlan(db, {
    id: `plan_za_single_${stamp}`,
    code: `single_${stamp}`,
    name: "Single Commercial",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 79900,
    credits: 1,
    interval: "one_time",
    metadataJson: null,
  });
  const secret = `whsec_${stamp}`;
  const provider = createMockPaymentProvider({ webhookSecret: secret });
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "http://localhost:3000/dashboard/billing",
    provider,
  });

  const wrongAmount = chargeBody({
    id: stamp + 1,
    reference: checkout.reference,
    amount: 1,
    currency: "ZAR",
    workspaceId: studio.workspaceId,
    planId: plan.id,
  });
  const amountResult = await processSignedPaystackWebhook(db, {
    rawBody: wrongAmount,
    signature: signPaystackBody(wrongAmount, secret),
    provider,
  });
  assert.equal(amountResult.granted, false);
  assert.equal(amountResult.reason, "amount");
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const wrongCurrency = await fulfillVerifiedCharge(db, {
    provider: "paystack",
    eventId: `charge.success:${stamp + 2}`,
    eventType: "charge.success",
    reference: `${checkout.reference}-currency`,
    amountMinor: 79900,
    currency: "USD",
    status: "success",
    metadata: { workspaceId: studio.workspaceId, planId: plan.id },
  });
  assert.equal(wrongCurrency.granted, false);
  assert.equal(wrongCurrency.reason, "currency");
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);
});

test("invalid webhook signature is rejected and does not grant credits", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 7;
  const { studio } = await openStudio(db, stamp);
  const plan = await insertTestPlan(db, {
    id: `plan_sig_${stamp}`,
    code: `sig_${stamp}`,
    name: "Single Commercial",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 79900,
    credits: 1,
    interval: "one_time",
    metadataJson: null,
  });
  const secret = `whsec_${stamp}`;
  const provider = createMockPaymentProvider({ webhookSecret: secret });
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "http://localhost:3000/dashboard/billing",
    provider,
  });
  const rawBody = chargeBody({
    id: stamp,
    reference: checkout.reference,
    amount: 79900,
    currency: "ZAR",
    workspaceId: studio.workspaceId,
    planId: plan.id,
  });
  await assert.rejects(
    () =>
      processSignedPaystackWebhook(db, {
        rawBody,
        signature: "not-a-real-signature",
        provider,
      }),
    (error: unknown) => error instanceof Error && error.message.includes("confirm"),
  );
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);
});

test("subscription allocation grants plan credits and records the monthly plan", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 11;
  const { studio } = await openStudio(db, stamp);
  const plan = await insertTestPlan(db, {
    id: `plan_za_starter_${stamp}`,
    code: `starter_${stamp}`,
    name: "Starter",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 149900,
    credits: 2,
    interval: "month",
    metadataJson: null,
  });
  const provider = createMockPaymentProvider();
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "http://localhost:3000/dashboard/billing",
    provider,
    requireProviderPlanCode: false,
  });
  const granted = await fulfillVerifiedCharge(db, {
    provider: "paystack",
    eventId: `charge.success:${stamp}`,
    eventType: "charge.success",
    reference: checkout.reference,
    amountMinor: 149900,
    currency: "ZAR",
    status: "success",
    metadata: { workspaceId: studio.workspaceId, planId: plan.id },
    subscription: {
      providerSubscriptionId: `sub_${stamp}`,
      providerCustomerId: `cus_${stamp}`,
      emailToken: "email-token",
    },
  });
  assert.equal(granted.granted, true);
  assert.equal(granted.credits, 2);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 2);
  const subscription = await getActiveSubscription(db, studio.workspaceId);
  assert.ok(subscription);
  assert.equal(subscription?.planCode, `starter_${stamp}`);
  assert.equal(subscription?.status, "active");
  const [row] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.workspaceId, studio.workspaceId));
  assert.equal(row?.cancelAtPeriodEnd, false);
  const [ledger] = await db
    .select()
    .from(creditTransactions)
    .where(eq(creditTransactions.workspaceId, studio.workspaceId));
  assert.equal(ledger?.type, "SUBSCRIPTION_GRANT");
  assert.equal(ledger?.amount, 2);
});

function signedPayfastBody(fields: Record<string, string>, passphrase: string) {
  const pairs = Object.entries(fields).map(([key, value]) => `${key}=${payfastUrlEncode(value)}`);
  const signature = md5Hex(`${pairs.join("&")}&passphrase=${payfastUrlEncode(passphrase)}`);
  const body = new URLSearchParams({ ...fields, signature });
  return body.toString();
}

test("PayFast ITN grants once after signature and server confirmation; redirect does not", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 17;
  const { studio } = await openStudio(db, stamp);
  const plan = await insertTestPlan(db, {
    id: `plan_za_payfast_${stamp}`,
    code: `payfast_${stamp}`,
    name: "Single Commercial",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 79900,
    credits: 1,
    interval: "one_time",
    metadataJson: null,
  });
  const passphrase = `pf_${stamp}`;
  const merchantId = "10000100";
  const provider = createPayfastProvider({
    merchantId,
    merchantKey: "46f0cd694581a",
    passphrase,
    mode: "sandbox",
    appUrl: "http://localhost:3000",
  });
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "http://localhost:3000/dashboard/billing",
    provider,
    providerName: "payfast",
  });
  assert.match(checkout.authorizationUrl, /\/api\/billing\/payfast\/start/);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const redirect = await inspectCheckoutRedirect(db, {
    reference: checkout.reference,
    success: "true",
  });
  assert.equal(redirect.granted, false);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const rawBody = signedPayfastBody(
    {
      m_payment_id: checkout.reference,
      pf_payment_id: String(stamp),
      payment_status: "COMPLETE",
      amount_gross: "799.00",
      merchant_id: merchantId,
      custom_str1: studio.workspaceId,
      custom_str2: plan.id,
    },
    passphrase,
  );
  const first = await processSignedPayfastItn(db, {
    rawBody,
    provider,
    merchantId,
    postedMerchantId: merchantId,
    confirm: async () => true,
  });
  assert.equal(first.granted, true);
  assert.equal(first.credits, 1);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  const duplicate = await processSignedPayfastItn(db, {
    rawBody,
    provider,
    merchantId,
    postedMerchantId: merchantId,
    confirm: async () => true,
  });
  assert.equal(duplicate.granted, false);
  assert.equal(duplicate.alreadyProcessed, true);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  await assert.rejects(
    () =>
      processSignedPayfastItn(db, {
        rawBody: signedPayfastBody(
          {
            m_payment_id: `${checkout.reference}-bad`,
            pf_payment_id: String(stamp + 1),
            payment_status: "COMPLETE",
            amount_gross: "799.00",
            merchant_id: merchantId,
          },
          "wrong-passphrase",
        ),
        provider,
        merchantId,
        postedMerchantId: merchantId,
        confirm: async () => true,
      }),
    (error: unknown) => error instanceof Error && error.message.includes("confirm"),
  );
});

test("PayFast charges dollar plans in rand and grants the catalog credits", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 23;
  const owner = await insertPerson(db, `phase14.usd.${stamp}@cineyou.test`, "Owner International");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Fourteen USD ${stamp}`,
    type: "BUSINESS",
    country: "US",
    business: { name: `Billing Brand USD ${stamp}` },
  });
  const plan = await insertTestPlan(db, {
    id: `plan_int_payfast_${stamp}`,
    code: `int_single_${stamp}`,
    name: "Single Commercial",
    region: "INT",
    currency: "USD",
    amountMinor: 4900,
    credits: 1,
    interval: "one_time",
    metadataJson: null,
  });
  const passphrase = `pf_usd_${stamp}`;
  const merchantId = "10000100";
  const provider = createPayfastProvider({
    merchantId,
    merchantKey: "46f0cd694581a",
    passphrase,
    mode: "sandbox",
    appUrl: "http://localhost:3000",
  });
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.usd.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "http://localhost:3000/dashboard/billing",
    provider,
    providerName: "payfast",
    usdZarRate: 18.5,
  });
  assert.match(checkout.authorizationUrl, /\/api\/billing\/payfast\/start/);
  const rawBody = signedPayfastBody(
    {
      m_payment_id: checkout.reference,
      pf_payment_id: String(stamp),
      payment_status: "COMPLETE",
      amount_gross: "906.50",
      merchant_id: merchantId,
      custom_str1: studio.workspaceId,
      custom_str2: plan.id,
    },
    passphrase,
  );
  const granted = await processSignedPayfastItn(db, {
    rawBody,
    provider,
    merchantId,
    postedMerchantId: merchantId,
    confirm: async () => true,
  });
  assert.equal(granted.granted, true);
  assert.equal(granted.credits, 1);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);
});

test("Payoneer grants once after GET charge is charged; redirect does not", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 31;
  const { studio } = await openStudio(db, stamp);
  const plan = await insertTestPlan(db, {
    id: `plan_za_payoneer_${stamp}`,
    code: `payoneer_${stamp}`,
    name: "Single Commercial",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 79900,
    credits: 1,
    interval: "one_time",
    metadataJson: null,
  });
  const longId = `chg_${stamp}za01`;
  const provider = createPayoneerProvider({
    username: "merchant",
    token: "token",
    mode: "sandbox",
    appUrl: "http://localhost:3000",
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          links: { self: "https://api.sandbox.oscato.com/api/lists/list_abcdefgh" },
        }),
        { status: 201 },
      )) as typeof fetch,
  });
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "http://localhost:3000/dashboard/billing",
    provider,
    providerName: "payoneer",
  });
  assert.match(checkout.authorizationUrl, /resources\.sandbox\.oscato\.com\/paymentpage\/v3/);
  const redirect = await inspectCheckoutRedirect(db, {
    reference: checkout.reference,
    success: "true",
  });
  assert.equal(redirect.granted, false);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const pending = await processPayoneerNotification(db, {
    rawBody: JSON.stringify({
      longId,
      transactionId: checkout.reference,
      interactionCode: "PROCEED",
      interactionReason: "PENDING",
    }),
    provider,
    confirm: async () => ({
      longId,
      transactionId: checkout.reference,
      statusCode: "pending",
      amountMinor: 79900,
      currency: "ZAR",
    }),
  });
  assert.equal(pending.granted, false);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const first = await processPayoneerNotification(db, {
    rawBody: JSON.stringify({
      longId,
      transactionId: checkout.reference,
      interactionCode: "PROCEED",
      interactionReason: "OK",
    }),
    provider,
    confirm: async () => ({
      longId,
      transactionId: checkout.reference,
      statusCode: "charged",
      amountMinor: 79900,
      currency: "ZAR",
    }),
  });
  assert.equal(first.granted, true);
  assert.equal(first.credits, 1);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  const duplicate = await processPayoneerNotification(db, {
    rawBody: JSON.stringify({
      longId,
      transactionId: checkout.reference,
      interactionCode: "PROCEED",
      interactionReason: "OK",
    }),
    provider,
    confirm: async () => ({
      longId,
      transactionId: checkout.reference,
      statusCode: "charged",
      amountMinor: 79900,
      currency: "ZAR",
    }),
  });
  assert.equal(duplicate.granted, false);
  assert.equal(duplicate.alreadyProcessed, true);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);
});

test("Payoneer charges dollar plans in dollars", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 37;
  const owner = await insertPerson(db, `phase14.usd.po.${stamp}@cineyou.test`, "Owner International");
  const studio = await createWorkspaceForOwner(db, {
    ownerUserId: owner,
    name: `Phase Fourteen USD Payoneer ${stamp}`,
    type: "BUSINESS",
    country: "US",
    business: { name: `Billing Brand USD PO ${stamp}` },
  });
  const plan = await insertTestPlan(db, {
    id: `plan_int_payoneer_${stamp}`,
    code: `int_po_${stamp}`,
    name: "Single Commercial",
    region: "INT",
    currency: "USD",
    amountMinor: 4900,
    credits: 1,
    interval: "one_time",
    metadataJson: null,
  });
  const longId = `chg_${stamp}usd1`;
  const provider = createPayoneerProvider({
    username: "merchant",
    token: "token",
    mode: "sandbox",
    appUrl: "http://localhost:3000",
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          links: { self: "https://api.sandbox.oscato.com/api/lists/list_usdabcde" },
        }),
        { status: 201 },
      )) as typeof fetch,
  });
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.usd.po.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "http://localhost:3000/dashboard/billing",
    provider,
    providerName: "payoneer",
  });
  const granted = await processPayoneerNotification(db, {
    rawBody: JSON.stringify({
      longId,
      transactionId: checkout.reference,
      interactionCode: "PROCEED",
      interactionReason: "OK",
    }),
    provider,
    confirm: async () => ({
      longId,
      transactionId: checkout.reference,
      statusCode: "charged",
      amountMinor: 4900,
      currency: "USD",
    }),
  });
  assert.equal(granted.granted, true);
  assert.equal(granted.credits, 1);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);
});

test("Rapyd grants once after GET payment is CLO and paid; redirect does not", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });
  const db = createDb(proxy.env.DB as D1Database);
  const stamp = Date.now() + 41;
  const { studio } = await openStudio(db, stamp);
  const plan = await insertTestPlan(db, {
    id: `plan_za_rapyd_${stamp}`,
    code: `rapyd_${stamp}`,
    name: "Single Commercial",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 79900,
    credits: 1,
    interval: "one_time",
    metadataJson: null,
  });
  const paymentId = `payment_${stamp}za`;
  const provider = createRapydProvider({
    accessKey: "rak_test",
    secretKey: "rsk_test_secret",
    mode: "sandbox",
    appUrl: "https://example.com",
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          status: { status: "SUCCESS" },
          data: {
            id: "checkout_abc123def",
            redirect_url: "https://sandboxcheckout.rapyd.net/?token=checkout_abc123def",
          },
        }),
        { status: 200 },
      )) as typeof fetch,
  });
  const checkout = await startCheckout(db, {
    workspaceId: studio.workspaceId,
    email: `phase14.${stamp}@cineyou.test`,
    planId: plan.id,
    callbackUrl: "https://example.com/dashboard/billing",
    provider,
    providerName: "rapyd",
  });
  assert.match(checkout.authorizationUrl, /sandboxcheckout\.rapyd\.net/);
  const redirect = await inspectCheckoutRedirect(db, {
    reference: checkout.reference,
    success: "true",
  });
  assert.equal(redirect.granted, false);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 0);

  const rawBody = JSON.stringify({
    id: `wh_${stamp}`,
    type: "PAYMENT_COMPLETED",
    data: { id: paymentId },
  });
  await assert.rejects(
    () =>
      processRapydNotification(db, {
        rawBody,
        signatureOk: false,
        provider,
        confirm: async () => ({
          paymentId,
          reference: checkout.reference,
          status: "CLO",
          paid: true,
          amountMinor: 79900,
          currency: "ZAR",
        }),
      }),
    (error: unknown) => error instanceof Error && error.message.includes("confirm"),
  );

  const pending = await processRapydNotification(db, {
    rawBody,
    signatureOk: true,
    provider,
    confirm: async () => ({
      paymentId,
      reference: checkout.reference,
      status: "ACT",
      paid: false,
      amountMinor: 79900,
      currency: "ZAR",
    }),
  });
  assert.equal(pending.granted, false);

  const first = await processRapydNotification(db, {
    rawBody,
    signatureOk: true,
    provider,
    confirm: async () => ({
      paymentId,
      reference: checkout.reference,
      status: "CLO",
      paid: true,
      amountMinor: 79900,
      currency: "ZAR",
    }),
  });
  assert.equal(first.granted, true);
  assert.equal(first.credits, 1);
  assert.equal(await getWalletBalance(db, studio.workspaceId), 1);

  const duplicate = await processRapydNotification(db, {
    rawBody,
    signatureOk: true,
    provider,
    confirm: async () => ({
      paymentId,
      reference: checkout.reference,
      status: "CLO",
      paid: true,
      amountMinor: 79900,
      currency: "ZAR",
    }),
  });
  assert.equal(duplicate.granted, false);
  assert.equal(duplicate.alreadyProcessed, true);
});

