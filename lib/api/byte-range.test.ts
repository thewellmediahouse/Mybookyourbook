import { test } from "node:test";
import assert from "node:assert/strict";
import {
  capBytesRange,
  contentRangeHeader,
  MAX_PLAYBACK_RANGE_BYTES,
  parseBytesRange,
  pickPlayableVideoAssetId,
  pickPreviewVideoAssetId,
  pickStudioStillAssetId,
  shouldBufferPrivateAsset,
} from "./byte-range";

test("parseBytesRange understands open, closed, and suffix spans", () => {
  assert.deepEqual(parseBytesRange(null, 1000), { kind: "all" });
  assert.deepEqual(parseBytesRange("bytes=0-1", 1000), { kind: "slice", start: 0, end: 1 });
  assert.deepEqual(parseBytesRange("bytes=100-", 1000), { kind: "slice", start: 100, end: 999 });
  assert.deepEqual(parseBytesRange("bytes=-50", 1000), { kind: "slice", start: 950, end: 999 });
  assert.deepEqual(parseBytesRange("bytes=0-999", 1000), { kind: "slice", start: 0, end: 999 });
  assert.equal(parseBytesRange("bytes=1000-", 1000).kind, "unsatisfiable");
  assert.equal(contentRangeHeader(0, 1, 1000), "bytes 0-1/1000");
});

test("capBytesRange keeps a Range slice to one megabyte and leaves a full-file request intact", () => {
  assert.deepEqual(capBytesRange({ kind: "all" }, 800_000, MAX_PLAYBACK_RANGE_BYTES), { kind: "all" });
  assert.deepEqual(capBytesRange({ kind: "all" }, 8_000_000, MAX_PLAYBACK_RANGE_BYTES), { kind: "all" });
  assert.deepEqual(
    capBytesRange({ kind: "slice", start: 2_000_000, end: 7_000_000 }, 8_000_000, MAX_PLAYBACK_RANGE_BYTES),
    { kind: "slice", start: 2_000_000, end: 2_000_000 + MAX_PLAYBACK_RANGE_BYTES - 1 },
  );
  assert.deepEqual(
    capBytesRange({ kind: "slice", start: 100, end: 200 }, 8_000_000, MAX_PLAYBACK_RANGE_BYTES),
    { kind: "slice", start: 100, end: 200 },
  );
});

test("pickPlayableVideoAssetId prefers a finished file, then enhanced, then filmed source", () => {
  assert.equal(
    pickPlayableVideoAssetId([
      { status: "FAILED", finalAssetId: null, sourceAssetId: null },
      { status: "COMPLETE", finalAssetId: "final-1", sourceAssetId: "source-1" },
    ]),
    "final-1",
  );
  assert.equal(
    pickPlayableVideoAssetId([
      {
        status: "COMPLETE",
        finalAssetId: null,
        enhancedAssetId: "enhanced-2",
        sourceAssetId: "source-2",
      },
    ]),
    "enhanced-2",
  );
  assert.equal(
    pickPlayableVideoAssetId([
      { status: "COMPLETE", finalAssetId: null, sourceAssetId: "source-2" },
    ]),
    "source-2",
  );
  assert.equal(
    pickPlayableVideoAssetId([{ status: "SEEDANCE_PROCESSING", finalAssetId: null, sourceAssetId: null }]),
    null,
  );
});

test("pickPreviewVideoAssetId prefers the filmed source over the finished file", () => {
  assert.equal(
    pickPreviewVideoAssetId([
      { status: "COMPLETE", finalAssetId: "final-1", sourceAssetId: "source-1" },
    ]),
    "source-1",
  );
  assert.equal(
    pickPreviewVideoAssetId([
      {
        status: "COMPLETE",
        finalAssetId: "final-2",
        enhancedAssetId: "enhanced-2",
        sourceAssetId: null,
      },
    ]),
    "final-2",
  );
  assert.equal(
    pickPreviewVideoAssetId([{ status: "SEEDANCE_PROCESSING", finalAssetId: null, sourceAssetId: null }]),
    null,
  );
});

test("pickStudioStillAssetId skips the tiny mock still and prefers a real photo", () => {
  assert.equal(
    pickStudioStillAssetId({
      thumbnailId: "tiny",
      thumbnailBytes: 334,
      referenceImageId: "ref-1",
      identityFrontId: "front-1",
    }),
    "ref-1",
  );
  assert.equal(
    pickStudioStillAssetId({
      thumbnailId: "tiny",
      thumbnailBytes: 334,
      referenceImageId: null,
      identityFrontId: "front-1",
    }),
    "front-1",
  );
  assert.equal(
    pickStudioStillAssetId({
      thumbnailId: "real",
      thumbnailBytes: 40_000,
      referenceImageId: "ref-1",
      identityFrontId: "front-1",
    }),
    "real",
  );
  assert.equal(shouldBufferPrivateAsset({ mimeType: "image/jpeg", download: false }), true);
  assert.equal(shouldBufferPrivateAsset({ mimeType: "video/mp4", download: false }), false);
  assert.equal(shouldBufferPrivateAsset({ mimeType: "image/png", download: true }), false);
});
