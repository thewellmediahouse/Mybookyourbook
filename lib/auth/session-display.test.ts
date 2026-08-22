import { test } from "node:test";
import assert from "node:assert/strict";
import { describeUserAgent } from "./session-display";

test("unknown user agents stay unknown", () => {
  assert.equal(describeUserAgent(null), "Unknown device");
});

test("describes a desktop Chrome agent", () => {
  assert.equal(
    describeUserAgent(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    ),
    "Chrome on desktop",
  );
});
