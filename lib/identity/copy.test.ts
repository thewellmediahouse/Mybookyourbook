import { test } from "node:test";
import assert from "node:assert/strict";
import {
  CONSENT_ADULT,
  CONSENT_IMPERSONATION,
  CONSENT_LIKENESS,
  CONSENT_PROCESSING,
  IDENTITY_BODY,
  IDENTITY_HEADING,
  PHOTO_GUIDES,
  videoPrompt,
} from "./copy";

test("identity page copy matches the spec", () => {
  assert.equal(IDENTITY_HEADING, "Your Reference Profile");
  assert.equal(
    IDENTITY_BODY,
    "We use this profile every time we film you: your selfie video, face photos, logo, and extra photos or clips of your business.",
  );
  assert.equal(
    CONSENT_LIKENESS,
    "I confirm that I am the person shown and heard in these reference files, or that I have explicit permission from this person to use their likeness and voice for commercial advertising.",
  );
  assert.equal(
    CONSENT_PROCESSING,
    "I understand that these references may be processed by external AI and media-processing services to create my requested commercial.",
  );
  assert.equal(
    CONSENT_IMPERSONATION,
    "I agree not to use Production30 to impersonate another person without authorization.",
  );
  assert.equal(CONSENT_ADULT, "I confirm that the person shown and heard is an adult.");
  assert.equal(PHOTO_GUIDES.IDENTITY_FRONT.title, "Image 1 — Front");
  assert.equal(PHOTO_GUIDES.IDENTITY_FRONT.instruction, "Look directly at the camera.");
  assert.equal(PHOTO_GUIDES.IDENTITY_LEFT.title, "Image 2 — Left angle");
  assert.equal(PHOTO_GUIDES.IDENTITY_LEFT.instruction, "Turn approximately 45° to your left.");
  assert.equal(PHOTO_GUIDES.IDENTITY_RIGHT.title, "Image 3 — Right angle");
  assert.equal(PHOTO_GUIDES.IDENTITY_RIGHT.instruction, "Turn approximately 45° to your right.");
  assert.equal(
    videoPrompt("Schalk", "Harbour Studio"),
    "Hi, I'm Schalk from Harbour Studio. We help our clients get better results through what we do.",
  );
});
