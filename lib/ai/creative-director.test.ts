import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAdStrategy } from "./ad-strategies";
import {
  createCreativeDirector,
  createMockCreativeDirector,
  generateConceptWithRetry,
  parseCreativeConcept,
  type CreativeBrief,
  type CreativeConcept,
  type CreativeDirectorProvider,
} from "./creative-director";

const sampleBrief: CreativeBrief = {
  businessName: "Harbour Legal",
  industry: "law",
  campaignTitle: "Harbour launch",
  advertisingType: "Service",
  targetCustomer: "Boat owners",
  problem: "Slow bookings",
  valueProposition: "We handle the whole trip",
  offer: "Free consultation",
  ctaType: "Call",
  ctaValue: "021 000 0000",
  style: "Cinematic",
  tones: ["Warm", "Confident"],
  avoid: "Do not mention discounts",
  platform: "TikTok",
  aspectRatio: "9:16",
  durationSeconds: 30,
  strategy: resolveAdStrategy("law"),
};

test("mock concept passes Zod and covers a 30 second timeline", async () => {
  const concept = await createMockCreativeDirector().generateConcept(sampleBrief);
  const parsed = parseCreativeConcept(concept);
  assert.equal(parsed.scenes[0]?.startSecond, 0);
  assert.equal(parsed.scenes.at(-1)?.endSecond, 30);
  assert.deepEqual(
    parsed.scenes.map((scene) => `${scene.startSecond}–${scene.endSecond}`),
    ["0–5", "5–11", "11–18", "18–25", "25–30"],
  );
  assert.match(parsed.strategy, /credibility/i);
  assert.doesNotMatch(parsed.hook, /Seedance|OpenAI|FFmpeg/i);
});

test("mock mode does not call paid HTTP", async () => {
  const original = globalThis.fetch;
  let called = 0;
  globalThis.fetch = (async () => {
    called += 1;
    throw new Error("paid HTTP must not run in mock mode");
  }) as typeof fetch;
  try {
    await createMockCreativeDirector().generateConcept(sampleBrief);
    await createCreativeDirector({
      AI_PROVIDER_MODE: "mock",
      OPENAI_API_KEY: "sk-test-must-not-be-used",
    }).generateConcept(sampleBrief);
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("invalid structured output retries then succeeds", async () => {
  let calls = 0;
  const provider: CreativeDirectorProvider = {
    async generateConcept() {
      calls += 1;
      if (calls === 1) {
        return { title: "" } as CreativeConcept;
      }
      return createMockCreativeDirector().generateConcept(sampleBrief);
    },
  };
  const result = await generateConceptWithRetry(provider, sampleBrief);
  assert.equal(calls, 2);
  assert.ok(result.hook.length > 0);
});

test("live mode without a key does not silently mock", async () => {
  const original = globalThis.fetch;
  let called = 0;
  globalThis.fetch = (async () => {
    called += 1;
    throw new Error("should not fetch");
  }) as typeof fetch;
  try {
    const pipelineLive = createCreativeDirector({ AI_PROVIDER_MODE: "live" });
    await assert.rejects(
      () => pipelineLive.generateConcept(sampleBrief),
      (error: unknown) => error instanceof Error && error.message.includes("try again later"),
    );
    const conceptLive = createCreativeDirector({ CONCEPT_AI_MODE: "live" });
    await assert.rejects(
      () => conceptLive.generateConcept(sampleBrief),
      (error: unknown) => error instanceof Error && error.message.includes("try again later"),
    );
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});
