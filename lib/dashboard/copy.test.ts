import { test } from "node:test";
import assert from "node:assert/strict";
import {
  COMMERCIALS_HEADING,
  CREATE_BUTTON,
  EMPTY_BODY,
  EMPTY_CTA,
  EMPTY_HEADING,
  EMPTY_STEPS,
  WELCOME_SUBHEADING,
  creditsAvailableLabel,
  welcomeHeading,
} from "./copy";

test("empty dashboard copy matches the spec", () => {
  assert.equal(EMPTY_HEADING, "Your first commercial starts here.");
  assert.equal(
    EMPTY_BODY,
    "Tell us about your business, show us who you are, and Production30 will direct and produce the rest.",
  );
  assert.equal(EMPTY_CTA, "Create My First Advert");
  assert.deepEqual([...EMPTY_STEPS], [
    "Choose your profile",
    "Write your script",
    "Approve it",
    "We film it",
  ]);
});

test("overview header copy matches the spec", () => {
  assert.equal(welcomeHeading("Schalk"), "Welcome back, Schalk.");
  assert.equal(WELCOME_SUBHEADING, "What would you like to create today?");
  assert.equal(CREATE_BUTTON, "+ Create Advert");
  assert.equal(COMMERCIALS_HEADING, "My Adverts");
});

test("credit labels use the real balance", () => {
  assert.equal(creditsAvailableLabel(0), "0 available");
  assert.equal(creditsAvailableLabel(4), "4 available");
});
