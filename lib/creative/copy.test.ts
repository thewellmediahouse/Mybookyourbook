import { test } from "node:test";
import assert from "node:assert/strict";
import { CONCEPT_HEADING, CONCEPT_HOOK_LABEL, CONCEPT_SPOKEN_LABEL } from "./copy";

test("concept copy uses customer language", () => {
  assert.equal(CONCEPT_HEADING, "Your Commercial Concept");
  assert.equal(CONCEPT_HOOK_LABEL, "Hook");
  assert.equal(CONCEPT_SPOKEN_LABEL, "Your Spoken Words");
  const blob = `${CONCEPT_HEADING} ${CONCEPT_HOOK_LABEL} ${CONCEPT_SPOKEN_LABEL}`;
  assert.doesNotMatch(blob, /Seedance|OpenAI|FFmpeg|inference/i);
});
