import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeLibraryMime } from "./mime";

test("library photos accept PNG JPEG WebP; SVG only for logos", () => {
  assert.equal(normalizeLibraryMime("image/png", "product"), "image/png");
  assert.equal(normalizeLibraryMime("image/jpg", "location"), "image/jpeg");
  assert.equal(normalizeLibraryMime("image/svg+xml", "logo"), "image/svg+xml");
  assert.equal(normalizeLibraryMime("image/svg+xml", "product"), null);
  assert.equal(normalizeLibraryMime("video/mp4", "campaign"), null);
});
