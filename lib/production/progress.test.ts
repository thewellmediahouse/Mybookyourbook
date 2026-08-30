import { test } from "node:test";
import assert from "node:assert/strict";
import { productionProgressLabel, productionProgressPercent } from "./copy";

test("progress bar stays visible before, during, and after filming", () => {
  assert.equal(productionProgressPercent(null), 15);
  assert.equal(productionProgressLabel(null), "Ready to film");
  assert.equal(productionProgressPercent("SEEDANCE_PROCESSING"), 40);
  assert.equal(productionProgressLabel("SEEDANCE_PROCESSING"), "Filming Your Commercial");
  assert.equal(productionProgressPercent("TOPAZ_PROCESSING"), 65);
  assert.equal(productionProgressLabel("TOPAZ_PROCESSING"), "Enhancing Your Footage");
  assert.equal(productionProgressPercent("BRANDING"), 85);
  assert.equal(productionProgressLabel("BRANDING"), "Adding Your Brand");
  assert.equal(productionProgressPercent("COMPLETE"), 100);
  assert.equal(productionProgressLabel("COMPLETE"), "Your commercial is ready.");
  assert.equal(productionProgressPercent("FAILED"), 0);
});
