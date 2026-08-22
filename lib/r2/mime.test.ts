import { test } from "node:test";
import assert from "node:assert/strict";
import { isAllowedLogoMime, normalizeLogoMime } from "./mime";

test("logo MIME allowlist accepts PNG JPEG WebP SVG only", () => {
  assert.equal(normalizeLogoMime("image/png"), "image/png");
  assert.equal(normalizeLogoMime("image/jpg"), "image/jpeg");
  assert.equal(normalizeLogoMime("image/svg+xml"), "image/svg+xml");
  assert.equal(isAllowedLogoMime("image/gif"), false);
  assert.equal(isAllowedLogoMime("application/pdf"), false);
  assert.equal(isAllowedLogoMime("video/mp4"), false);
});
