import { test } from "node:test";
import assert from "node:assert/strict";
import {
  ADVERTISING_TYPES,
  CTA_TYPES,
  recommendedAspectRatio,
  requireExplicitAspectRatio,
  titleFromPrompt,
} from "./brief";
import { briefReadyForConcept } from "./save";
import { resolveSimpleWizardStep, SIMPLE_WIZARD_STEPS } from "./copy";

test("brief option lists match the spec", () => {
  assert.equal(ADVERTISING_TYPES[0], "Business");
  assert.equal(CTA_TYPES.includes("WhatsApp"), true);
  assert.deepEqual(
    SIMPLE_WIZARD_STEPS.map((step) => step.label),
    ["Profile", "Script", "Approve", "Generate"],
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

test("prompt first line becomes the advert name", () => {
  assert.equal(titleFromPrompt("Saturday bread special\nWarm light"), "Saturday bread special");
  assert.equal(titleFromPrompt(""), "");
});

test("simple create flow opens on the next unfinished step", () => {
  assert.equal(
    resolveSimpleWizardStep({
      profileReady: false,
      conceptApproved: false,
      hasConcept: false,
      briefReady: false,
    }),
    0,
  );
  assert.equal(
    resolveSimpleWizardStep({
      profileReady: true,
      conceptApproved: false,
      hasConcept: false,
      briefReady: false,
    }),
    0,
  );
  assert.equal(
    resolveSimpleWizardStep({
      freshStart: true,
      profileReady: true,
      conceptApproved: true,
      hasConcept: true,
      briefReady: true,
    }),
    0,
  );
  assert.equal(
    resolveSimpleWizardStep({
      requested: "generate",
      profileReady: true,
      conceptApproved: true,
      hasConcept: true,
      briefReady: true,
    }),
    3,
  );
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
