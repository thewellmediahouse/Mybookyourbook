import { test } from "node:test";
import assert from "node:assert/strict";
import { isStrongPassword, normalizeEmail } from "./password";

test("normalizes email", () => {
  assert.equal(normalizeEmail("  Alex@Production30.COM "), "alex@production30.com");
});

test("rejects short passwords", () => {
  assert.equal(isStrongPassword("Ab1"), false);
});

test("rejects passwords without a number", () => {
  assert.equal(isStrongPassword("abcdefghij"), false);
});

test("accepts a strong password", () => {
  assert.equal(isStrongPassword("StudioPass1"), true);
});
