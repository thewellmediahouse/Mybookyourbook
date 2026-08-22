import { test } from "node:test";
import assert from "node:assert/strict";
import { IDENTITY_REFERENCE_MAP, parseIdentitySlot, slotPath } from "./slots";

test("identity slots map internally and never use customer-facing vendor names", () => {
  assert.equal(parseIdentitySlot("front"), "IDENTITY_FRONT");
  assert.equal(parseIdentitySlot("left"), "IDENTITY_LEFT");
  assert.equal(parseIdentitySlot("right"), "IDENTITY_RIGHT");
  assert.equal(parseIdentitySlot("video"), "IDENTITY_VIDEO");
  assert.equal(parseIdentitySlot("unknown"), null);
  assert.equal(slotPath("IDENTITY_FRONT"), "front");
  assert.equal(IDENTITY_REFERENCE_MAP.IDENTITY_FRONT, "@Image1");
  assert.equal(IDENTITY_REFERENCE_MAP.IDENTITY_LEFT, "@Image2");
  assert.equal(IDENTITY_REFERENCE_MAP.IDENTITY_RIGHT, "@Image3");
  assert.equal(IDENTITY_REFERENCE_MAP.IDENTITY_VIDEO, "@Video1");
});
