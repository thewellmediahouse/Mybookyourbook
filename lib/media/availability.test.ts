import { test } from "node:test";
import assert from "node:assert/strict";
import { libraryWriteAvailability } from "./availability";

test("viewers and paused members cannot change the library", () => {
  const brandId = "brand";
  assert.equal(
    libraryWriteAvailability({ role: "OWNER", memberStatus: "active", brandId }).allowed,
    true,
  );
  const viewer = libraryWriteAvailability({ role: "VIEWER", memberStatus: "active", brandId });
  assert.equal(viewer.allowed, false);
  const paused = libraryWriteAvailability({ role: "OWNER", memberStatus: "suspended", brandId });
  assert.equal(paused.allowed, false);
  const missing = libraryWriteAvailability({ role: "OWNER", memberStatus: "active", brandId: null });
  assert.equal(missing.allowed, false);
});
