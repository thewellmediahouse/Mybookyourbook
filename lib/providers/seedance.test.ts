import { test } from "node:test";
import assert from "node:assert/strict";
import { IDENTITY_REFERENCE_MAP } from "@/lib/identity/slots";
import {
  BACKGROUND_SIGNAGE_INSTRUCTION,
  CONTEXT_REFERENCE_MAP,
  IDENTITY_INSTRUCTION,
  LOGO_REFERENCE_INSTRUCTION,
  LOGO_REFERENCE_TAG,
  NO_GENERATED_TEXT_INSTRUCTION,
  NO_SMALL_CTA_INSTRUCTION,
  SCENE_NO_WRITING_LINE,
  buildSeedancePrompt,
  contextReferenceTag,
} from "./video/seedance/prompt-builder";
import { PLAIN_SURFACES } from "@/lib/creative/on-screen-text";
import type { ConceptScene } from "@/lib/ai/creative-director";

const scenes: ConceptScene[] = [
  {
    startSecond: 0,
    endSecond: 5,
    visual: "Presenter in a calm office.",
    presenterAction: "Look to camera.",
    camera: "Slow push-in.",
    dialogue: "If bookings feel slow, this is for you.",
    audio: "Quiet room tone.",
  },
  {
    startSecond: 5,
    endSecond: 11,
    visual: "The harbour and the work underway.",
    presenterAction: "Gesture toward the work.",
    camera: "Gentle tracking shot.",
    dialogue: "We handle the whole trip.",
    audio: "Natural harbour ambience.",
  },
  {
    startSecond: 25,
    endSecond: 30,
    visual: "Close on the presenter.",
    presenterAction: "Hold a still look to camera.",
    camera: "Steady medium shot.",
    dialogue: "Call us today.",
    audio: "Clear voice to the last word.",
  },
];

const approvedScript =
  "If bookings feel slow, this is for you. We handle the whole trip. Call us today.";

test("prompt builder maps identity, context, format, locked dialogue, and no-text rule", () => {
  const prompt = buildSeedancePrompt({
    approvedScript,
    scenes,
    aspectRatio: "9:16",
    durationSeconds: 30,
    style: "Cinematic",
    contextSlots: ["CONTEXT_1", "CONTEXT_2"],
    draftScript: "Call us NOW for fifty percent off.",
  });

  assert.match(prompt, /@Image1 = identity front/);
  assert.match(prompt, /@Image2 = identity left/);
  assert.match(prompt, /@Image3 = identity right/);
  assert.match(prompt, /@Video1 = presenter video/);
  assert.equal(IDENTITY_REFERENCE_MAP.IDENTITY_FRONT, "@Image1");
  assert.equal(IDENTITY_REFERENCE_MAP.IDENTITY_LEFT, "@Image2");
  assert.equal(IDENTITY_REFERENCE_MAP.IDENTITY_RIGHT, "@Image3");
  assert.equal(IDENTITY_REFERENCE_MAP.IDENTITY_VIDEO, "@Video1");
  assert.equal(CONTEXT_REFERENCE_MAP.CONTEXT_1, "@Image4");
  assert.equal(CONTEXT_REFERENCE_MAP.CONTEXT_2, "@Image5");
  assert.match(prompt, /@Image4 = campaign context/);
  assert.match(prompt, /@Image5 = campaign context/);
  assert.doesNotMatch(prompt, /@Image6 = campaign context/);
  assert.match(prompt, /Aspect ratio: 9:16/);
  assert.match(prompt, /Duration: 30 seconds/);
  assert.match(prompt, /Advertising style: Cinematic/);
  assert.match(prompt, /0–5 seconds:/);
  assert.match(prompt, /5–11 seconds:/);
  assert.match(prompt, /25–30 seconds:/);
  assert.ok(prompt.includes(approvedScript));
  assert.ok(prompt.includes("Dialogue (locked, do not rewrite): If bookings feel slow, this is for you."));
  assert.ok(prompt.includes(IDENTITY_INSTRUCTION));
  assert.ok(prompt.includes(NO_GENERATED_TEXT_INSTRUCTION));
  assert.ok(prompt.includes(BACKGROUND_SIGNAGE_INSTRUCTION));
  assert.ok(prompt.includes(NO_SMALL_CTA_INSTRUCTION));
  assert.ok(prompt.includes(SCENE_NO_WRITING_LINE));
  assert.doesNotMatch(prompt, /important readable written text/i);
  assert.doesNotMatch(prompt, /fifty percent off/i);
  assert.doesNotMatch(prompt, /Seedance|fal\.ai|Topaz|FFmpeg/i);
});

test("prompt builder always includes the no-generated-text instruction", () => {
  const prompt = buildSeedancePrompt({
    approvedScript: "Call us today.",
    scenes: [
      {
        startSecond: 0,
        endSecond: 15,
        visual: "Presenter to camera.",
        presenterAction: null,
        camera: "Steady shot.",
        dialogue: "Call us today.",
        audio: null,
      },
    ],
    aspectRatio: "16:9",
    durationSeconds: 15,
    style: "Professional",
  });
  assert.ok(prompt.includes(NO_GENERATED_TEXT_INSTRUCTION));
  assert.match(prompt, /Aspect ratio: 16:9/);
  assert.match(prompt, /Duration: 15 seconds/);
  assert.doesNotMatch(prompt, /@Image4/);
});

test("prompt builder accepts 10 seconds and maps a brand mark before extras", () => {
  const prompt = buildSeedancePrompt({
    approvedScript: "Call us today.",
    scenes: [
      {
        startSecond: 0,
        endSecond: 10,
        visual: "Presenter to camera.",
        presenterAction: null,
        camera: "Steady shot.",
        dialogue: "Call us today.",
        audio: null,
      },
    ],
    aspectRatio: "9:16",
    durationSeconds: 10,
    style: "Social",
    contextSlots: ["CONTEXT_1"],
    includeLogo: true,
  });
  assert.match(prompt, /Duration: 10 seconds/);
  assert.match(prompt, new RegExp(`${LOGO_REFERENCE_TAG} = brand mark`));
  assert.match(prompt, /@Image5 = campaign context/);
  assert.doesNotMatch(prompt, /@Image4 = campaign context/);
  assert.equal(contextReferenceTag("CONTEXT_1", true), "@Image5");
  assert.ok(prompt.includes(LOGO_REFERENCE_INSTRUCTION));
});

test("prompt builder will not rewrite dialogue that is not in the approved script", () => {
  assert.throws(
    () =>
      buildSeedancePrompt({
        approvedScript: "Call us today.",
        scenes: [
          {
            startSecond: 0,
            endSecond: 15,
            visual: "Presenter to camera.",
            presenterAction: null,
            camera: "Steady shot.",
            dialogue: "Guaranteed results this week.",
            audio: null,
          },
        ],
        aspectRatio: "1:1",
        durationSeconds: 15,
        style: "Professional",
      }),
    (error: unknown) => error instanceof Error && error.message.includes("approved script"),
  );
});

test("prompt builder strips small on-screen text and CTA requests from the filmed scene", () => {
  const prompt = buildSeedancePrompt({
    approvedScript: "Call us today.",
    scenes: [
      {
        startSecond: 0,
        endSecond: 15,
        visual: "Hold a sign that says Call Now with a small text button.",
        presenterAction: "Point at the on-screen CTA button.",
        camera: "Steady shot.",
        dialogue: "Call us today.",
        audio: null,
      },
    ],
    aspectRatio: "16:9",
    durationSeconds: 15,
    style: "Professional",
  });
  assert.ok(prompt.includes(PLAIN_SURFACES));
  assert.ok(prompt.includes(NO_SMALL_CTA_INSTRUCTION));
  assert.doesNotMatch(prompt, /Hold a sign that says Call Now/);
  assert.doesNotMatch(prompt, /on-screen CTA button/);
  assert.match(prompt, /Dialogue \(locked, do not rewrite\): Call us today\./);
});
