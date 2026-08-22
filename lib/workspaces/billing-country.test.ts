import { test } from "node:test";
import assert from "node:assert/strict";
import { billingForCountry } from "./billing-country";
import { slugify } from "./slug";

test("South Africa bills in rand", () => {
  assert.deepEqual(billingForCountry("ZA"), {
    country: "ZA",
    region: "ZA",
    billingCurrency: "ZAR",
  });
});

test("other countries use international USD list prices", () => {
  assert.equal(billingForCountry("US").billingCurrency, "USD");
  assert.equal(billingForCountry("US").region, "INT");
});

test("slugify is URL-safe", () => {
  assert.equal(slugify("The Cool Guy"), "the-cool-guy");
});
