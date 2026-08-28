import { test } from "node:test";
import assert from "node:assert/strict";
import { isAdStyle, isAdvertisingType, isAspectRatio, isDuration, isPlatformOption } from "@/lib/projects/brief";
import { STUDIO_PRESETS, buildStudioStart, studioPresetById, presetsForLane } from "./presets";

test("every Ad Studio preset uses catalog brief values", () => {
  assert.ok(STUDIO_PRESETS.length >= 8);
  for (const preset of STUDIO_PRESETS) {
    assert.equal(isAdvertisingType(preset.brief.objective ?? ""), true, preset.id);
    assert.equal(isAdStyle(preset.brief.style ?? ""), true, preset.id);
    assert.equal(isPlatformOption(preset.brief.platform ?? ""), true, preset.id);
    assert.equal(isAspectRatio(preset.brief.aspectRatio ?? ""), true, preset.id);
    assert.equal(isDuration(preset.brief.duration ?? 0), true, preset.id);
  }
  assert.equal(presetsForLane("business")[0]?.id, "tvc");
  assert.equal(
    presetsForLane("business").map((item) => item.id).includes("motion-studio"),
    true,
  );
  assert.equal(presetsForLane("viral")[0]?.id, "ugc");
  assert.equal(studioPresetById("missing"), null);
});

test("business website start copies published facts into the CTA, not an invented offer", () => {
  const started = buildStudioStart({
    businessId: "biz_1",
    method: "website",
    websiteUrl: "harbour.example",
    pageTitle: "Harbour Cafe",
    pageDescription: "Coffee on the waterfront.",
    aspectRatio: "16:9",
  });
  assert.equal(started.ok, true);
  if (!started.ok) {
    return;
  }
  assert.equal(started.lane, "business");
  assert.equal(started.step, "goal");
  assert.equal(started.patch.ctaType, "Visit Website");
  assert.equal(started.patch.ctaValue, "https://harbour.example/");
  assert.equal(started.patch.title, "Harbour Cafe");
  assert.equal(started.patch.valueProposition, "Coffee on the waterfront.");
  assert.equal(started.patch.offer, undefined);
});

test("viral remake start opens references and does not store the original URL as the offer", () => {
  const started = buildStudioStart({
    businessId: "biz_1",
    method: "reference",
    originalAdvertUrl: "https://example.com/ad",
    aspectRatio: "9:16",
  });
  assert.equal(started.ok, true);
  if (!started.ok) {
    return;
  }
  assert.equal(started.lane, "viral");
  assert.equal(started.step, "references");
  assert.equal(started.patch.offer, undefined);
  assert.match(started.patch.problem ?? "", /example.com\/ad/);
});
