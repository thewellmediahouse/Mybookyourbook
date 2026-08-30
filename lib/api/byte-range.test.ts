import { test } from "node:test";
import assert from "node:assert/strict";
import { contentRangeHeader, parseBytesRange, pickPlayableVideoAssetId } from "./byte-range";

test("parseBytesRange understands open, closed, and suffix spans", () => {
  assert.deepEqual(parseBytesRange(null, 1000), { kind: "all" });
  assert.deepEqual(parseBytesRange("bytes=0-1", 1000), { kind: "slice", start: 0, end: 1 });
  assert.deepEqual(parseBytesRange("bytes=100-", 1000), { kind: "slice", start: 100, end: 999 });
  assert.deepEqual(parseBytesRange("bytes=-50", 1000), { kind: "slice", start: 950, end: 999 });
  assert.deepEqual(parseBytesRange("bytes=0-999", 1000), { kind: "slice", start: 0, end: 999 });
  assert.equal(parseBytesRange("bytes=1000-", 1000).kind, "unsatisfiable");
  assert.equal(contentRangeHeader(0, 1, 1000), "bytes 0-1/1000");
});

test("pickPlayableVideoAssetId prefers a finished file, then filmed source", () => {
  assert.equal(
    pickPlayableVideoAssetId([
      { status: "FAILED", finalAssetId: null, sourceAssetId: null },
      { status: "COMPLETE", finalAssetId: "final-1", sourceAssetId: "source-1" },
    ]),
    "final-1",
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
