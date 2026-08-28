import assert from "node:assert/strict";
import { test } from "node:test";
import { verifyEmailHref, verifyEmailPageCopy } from "./verify-email-copy";

test("signup thank-you copy names the inbox and does not ask for the email again", () => {
  const copy = verifyEmailPageCopy({ mailReady: true, email: "owner@studio.test" });
  assert.equal(copy.title, "Thank you");
  assert.match(copy.description, /owner@studio\.test/);
  assert.equal(/enter (your |an )?email/i.test(copy.description), false);
});

test("signup thank-you link carries the email so the next page can skip the form", () => {
  assert.equal(
    verifyEmailHref("owner@studio.test", "/onboarding"),
    "/verify-email?email=owner%40studio.test&next=%2Fonboarding",
  );
});
