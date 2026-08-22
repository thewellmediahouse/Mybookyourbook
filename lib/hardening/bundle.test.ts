import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  knownSecretValues,
  scanBuiltClientBundle,
  scanClientSources,
  scanTextForBundleLeaks,
} from "@/lib/security/bundle";

const ROOT = join(import.meta.dirname, "../..");

test("client source does not read provider secrets from process.env", () => {
  const leaks = scanClientSources(ROOT);
  assert.deepEqual(leaks, []);
});

test("NEXT_PUBLIC_ secret names are treated as bundle leaks", () => {
  const hits = scanTextForBundleLeaks("NEXT_PUBLIC_FAL_KEY=\nabc", []);
  assert.ok(hits.length > 0);
});

test("built client chunks do not contain known secret values", () => {
  const staticDir = join(ROOT, ".next/static");
  if (!existsSync(staticDir)) {
    if (process.env.CINEYOU_REQUIRE_BUNDLE === "1") {
      assert.fail("Expected .next/static after a production build.");
    }
    return;
  }
  const leaks = scanBuiltClientBundle(ROOT, knownSecretValues());
  assert.deepEqual(leaks, []);
});
