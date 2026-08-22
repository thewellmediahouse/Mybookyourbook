import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ALREADY_LANDSCAPE,
  NEW_ASPECT_RATIO_NOTICE,
  VARIATION_OPTIONS,
  VERSION_CREDIT_NOTICE,
  alreadyThisFormatMessage,
  assertNewAspectRatio,
  variationStyle,
  withTitleSuffix,
} from "./delivery";

test("format versions explain that a new aspect ratio uses 1 Ad Credit", () => {
  assert.equal(
    NEW_ASPECT_RATIO_NOTICE,
    "A new aspect ratio requires a new AI production and uses 1 Ad Credit.",
  );
  assert.equal(
    VERSION_CREDIT_NOTICE,
    "Creating a concept is free. Producing this commercial uses 1 Ad Credit.",
  );
  assert.equal(alreadyThisFormatMessage("16:9"), ALREADY_LANDSCAPE);
  assert.throws(
    () => assertNewAspectRatio("16:9", "16:9"),
    (error: unknown) => error instanceof Error && error.message === ALREADY_LANDSCAPE,
  );
  assert.doesNotThrow(() => assertNewAspectRatio("16:9", "9:16"));
});

test("variation presets match the completed-advert options", () => {
  assert.deepEqual(
    VARIATION_OPTIONS.map((option) => option.label),
    [
      "Funnier",
      "More Professional",
      "More Luxurious",
      "Stronger Sales Hook",
      "More Emotional",
      "Different Environment",
      "New Opening",
      "Custom Change",
    ],
  );
  assert.equal(variationStyle("funnier"), "Funny");
  assert.equal(variationStyle("custom"), undefined);
  assert.equal(withTitleSuffix("Harbour launch", "copy"), "Harbour launch (copy)");
});
