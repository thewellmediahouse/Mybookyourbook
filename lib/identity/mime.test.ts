import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeIdentityPhotoMime, normalizeIdentityVideoMime } from "./mime";

test("identity photos accept PNG JPEG WebP only", () => {
  assert.equal(normalizeIdentityPhotoMime("image/png"), "image/png");
  assert.equal(normalizeIdentityPhotoMime("image/jpg"), "image/jpeg");
  assert.equal(normalizeIdentityPhotoMime("image/webp"), "image/webp");
  assert.equal(normalizeIdentityPhotoMime("image/svg+xml"), null);
  assert.equal(normalizeIdentityPhotoMime("image/gif"), null);
});

test("identity video accepts common phone formats", () => {
  assert.equal(normalizeIdentityVideoMime("video/mp4"), "video/mp4");
  assert.equal(normalizeIdentityVideoMime("video/webm;codecs=vp9,opus"), "video/webm");
  assert.equal(normalizeIdentityVideoMime("video/quicktime"), "video/quicktime");
  assert.equal(normalizeIdentityVideoMime("video/x-m4v"), "video/x-m4v");
  assert.equal(normalizeIdentityVideoMime("video/avi"), null);
});
