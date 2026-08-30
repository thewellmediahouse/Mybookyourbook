import { test } from "node:test";
import assert from "node:assert/strict";
import {
  NO_GENERATED_TEXT_INSTRUCTION,
  NO_SMALL_CTA_INSTRUCTION,
  PLAIN_SURFACES,
  ensureFilmingTextBan,
  looksLikeOnScreenWriting,
  neutralizeOnScreenWriting,
  sanitizeFilmedSceneFields,
} from "./on-screen-text";

test("detects small text and on-screen call to action requests", () => {
  assert.equal(looksLikeOnScreenWriting("Presenter in a calm office."), false);
  assert.equal(looksLikeOnScreenWriting("Hold a sign that says Call Now."), true);
  assert.equal(looksLikeOnScreenWriting("Add a small text call to action in the corner."), true);
  assert.equal(looksLikeOnScreenWriting("On-screen CTA button that says Book now."), true);
  assert.equal(looksLikeOnScreenWriting("Show the phone number on a lower third."), true);
  assert.equal(looksLikeOnScreenWriting("Tiny text watermark in the corner."), true);
});

test("neutralize keeps the real scene and strips writing requests", () => {
  const cleaned = neutralizeOnScreenWriting(
    "Presenter in a shop. Hold a sign that says Call Now.",
  );
  assert.match(cleaned, /Presenter in a shop/);
  assert.ok(cleaned.includes(PLAIN_SURFACES));
  assert.doesNotMatch(cleaned, /Call Now/);
  assert.equal(neutralizeOnScreenWriting("Look to camera."), "Look to camera.");
});

test("spoken call to action is not treated as on-screen writing", () => {
  assert.equal(looksLikeOnScreenWriting("Call us today."), false);
  assert.equal(looksLikeOnScreenWriting("Take the next step today."), false);
});

test("sanitize leaves spoken words alone and cleans the picture", () => {
  const scene = sanitizeFilmedSceneFields({
    visual: "End card with a call-to-action button saying Book now.",
    presenterAction: "Point at the on-screen text.",
    camera: "Steady medium shot.",
    audio: "Clear spoken voice.",
    dialogue: "Call us today.",
  });
  assert.equal(scene.visual, PLAIN_SURFACES);
  assert.equal(scene.presenterAction, PLAIN_SURFACES);
  assert.equal(scene.dialogue, "Call us today.");
  assert.equal(scene.camera, "Steady medium shot.");
});

test("ensureFilmingTextBan appends missing no-writing rules", () => {
  const next = ensureFilmingTextBan("Locked spoken wording: Call us today.");
  assert.ok(next.includes(NO_GENERATED_TEXT_INSTRUCTION));
  assert.ok(next.includes(NO_SMALL_CTA_INSTRUCTION));
  assert.doesNotMatch(next, /important readable written text/i);
});
