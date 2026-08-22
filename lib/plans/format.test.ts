import { test } from "node:test";
import assert from "node:assert/strict";
import { formatMoney, parsePricingRegion, toPlanView } from "./format";

test("formats South African list prices from minor units", () => {
  assert.equal(formatMoney(59900, "ZAR"), "R599");
  assert.equal(formatMoney(349900, "ZAR"), "R3,499");
});

test("formats international list prices from minor units", () => {
  assert.equal(formatMoney(4900, "USD"), "$49");
});

test("Business plan is highlighted from catalog metadata", () => {
  const view = toPlanView({
    id: "plan_za_business",
    code: "business",
    name: "Business",
    region: "ZA",
    currency: "ZAR",
    amountMinor: 349900,
    credits: 5,
    interval: "month",
    metadataJson: '{"highlighted":true}',
  });
  assert.equal(view.highlighted, true);
  assert.equal(view.priceLabel, "R3,499/month");
  assert.equal(view.creditLabel, "5 Ad Credits");
});

test("Agency custom has no invented number", () => {
  const view = toPlanView({
    id: "plan_za_agency",
    code: "agency",
    name: "Agency",
    region: "ZA",
    currency: "ZAR",
    amountMinor: null,
    credits: null,
    interval: "month",
    metadataJson: '{"custom":true}',
  });
  assert.equal(view.priceLabel, "Custom");
  assert.equal(view.custom, true);
});

test("international agency uses a from-price, not a fake quote", () => {
  const view = toPlanView({
    id: "plan_int_agency",
    code: "agency",
    name: "Agency",
    region: "INT",
    currency: "USD",
    amountMinor: 69900,
    credits: null,
    interval: "month",
    metadataJson: '{"from":true}',
  });
  assert.equal(view.priceLabel, "From $699/month");
});

test("region query defaults to South Africa", () => {
  assert.equal(parsePricingRegion(undefined), "ZA");
  assert.equal(parsePricingRegion("INT"), "INT");
});
