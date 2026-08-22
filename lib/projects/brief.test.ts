import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ADVERTISING_TYPES,
  CTA_TYPES,
  recommendedAspectRatio,
  requireExplicitAspectRatio,
} from "./brief";
import { briefReadyForConcept } from "./save";
import { WIZARD_STEPS } from "./copy";

test("brief option lists match the spec", () => {
  assert.equal(ADVERTISING_TYPES[0], "Business");
  assert.equal(CTA_TYPES.includes("WhatsApp"), true);
  assert.deepEqual(
    WIZARD_STEPS.filter((step) => !("later" in step && step.later)).map((step) => step.label),
    ["Campaign", "Goal", "Style", "Format", "References", "Concept"],
  );
});

test("aspect ratio is recommended but never automatic", () => {
  assert.equal(recommendedAspectRatio("TikTok"), "9:16");
  assert.equal(recommendedAspectRatio("YouTube"), "16:9");
  assert.equal(recommendedAspectRatio("LinkedIn"), "1:1");
  assert.throws(
    () => requireExplicitAspectRatio("auto"),
    (error: unknown) => error instanceof Error && error.message.includes("do not pick the shape"),
  );
  assert.throws(() => requireExplicitAspectRatio(""));
  assert.equal(requireExplicitAspectRatio("9:16"), "9:16");
});

test("concept cannot start without an explicit aspect ratio", () => {
  const ready = briefReadyForConcept({
    title: "Harbour launch",
    objective: "Service",
    ctaType: "Call",
    style: "Cinematic",
    platform: "TikTok",
    aspectRatio: "",
    duration: 30,
  });
  assert.equal(ready.ready, false);
  if (!ready.ready) {
    assert.match(ready.reason, /9:16/);
  }
  assert.equal(
    briefReadyForConcept({
      title: "Harbour launch",
      objective: "Service",
      ctaType: "Call",
      style: "Cinematic",
      platform: "TikTok",
      aspectRatio: "9:16",
      duration: 30,
    }).ready,
    true,
  );
});
