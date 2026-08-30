import { test } from "node:test";
import assert from "node:assert/strict";
import { FIXTURE_MP4, FIXTURE_VIDEO_MIME } from "./video/fixture";
import {
  createReapiVideoProvider,
  createVideoGenerationProvider,
  REAPI_VIDEOS_URL,
  SEEDANCE_DURATION,
  SEEDANCE_MODEL_ID,
  SEEDANCE_RESOLUTION,
  seedanceSubmitBody,
} from "./video/seedance";

const TASK_ID = "task_018f5a3a1b6e7d9f8c2b4d6e8f0a2c4e";
const TASK_URL = `https://reapi.ai/api/v1/tasks/${TASK_ID}`;
const VIDEO_URL = "https://cdn.reapi.ai/media/tasks/018f5a3a1b6e7d9f8c2b4d6e8f0a2c4e/0.mp4";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

test("live Seedance payload is 480p, 30s, audio, and official size", () => {
  const body = seedanceSubmitBody({
    prompt: "Presenter speaks to camera.",
    aspectRatio: "9:16",
    durationSeconds: 15,
    imageUrls: ["https://signed.example/front.jpg", "https://signed.example/left.jpg"],
    videoUrls: ["https://signed.example/voice.mp4"],
  });
  assert.equal(body.model, SEEDANCE_MODEL_ID);
  assert.equal(body.resolution, SEEDANCE_RESOLUTION);
  assert.equal(body.duration, SEEDANCE_DURATION);
  assert.equal(body.generate_audio, true);
  assert.equal(body.output_format, "mp4");
  assert.equal(body.size, "9:16");
  assert.equal("aspect_ratio" in body, false);
  assert.deepEqual(body.image_urls, ["https://signed.example/front.jpg", "https://signed.example/left.jpg"]);
  assert.deepEqual(body.video_urls, ["https://signed.example/voice.mp4"]);
  assert.equal("bitrate_mode" in body, false);
  assert.equal("content_filter" in body, false);
  assert.throws(() => seedanceSubmitBody({
    prompt: "x",
    aspectRatio: "auto",
    durationSeconds: 30,
    imageUrls: [],
    videoUrls: [],
  }));
  assert.throws(() => seedanceSubmitBody({
    prompt: "x",
    aspectRatio: "adaptive",
    durationSeconds: 30,
    imageUrls: [],
    videoUrls: [],
  }));
});

test("mock mode never calls reAPI even when a key is present", async () => {
  let called = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    called += 1;
    throw new Error("paid HTTP must not run in mock mode");
  }) as typeof fetch;
  try {
    const provider = createVideoGenerationProvider({ AI_PROVIDER_MODE: "mock", REAPI_API_KEY: "rk_live_secret" });
    const submitted = await provider.submit({
      prompt: "Presenter speaks to camera.",
      aspectRatio: "9:16",
      durationSeconds: 30,
      imageUrls: [],
      videoUrls: [],
    });
    await provider.getStatus(submitted.id);
    await provider.getResult(submitted.id);
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("FILMING_AI_MODE=live uses reAPI while the rest of the pipeline stays mock", async () => {
  const provider = createVideoGenerationProvider({
    AI_PROVIDER_MODE: "mock",
    FILMING_AI_MODE: "live",
  });
  await assert.rejects(
    () =>
      provider.submit({
        prompt: "Presenter speaks to camera.",
        aspectRatio: "9:16",
        durationSeconds: 30,
        imageUrls: [],
        videoUrls: [],
      }),
    (error: unknown) => error instanceof Error && error.message === "Live filming is not connected yet.",
  );
});

test("FILMING_AI_MODE=mock keeps filming mock even when AI_PROVIDER_MODE is live", async () => {
  let called = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    called += 1;
    throw new Error("paid HTTP must not run when filming is mock");
  }) as typeof fetch;
  try {
    const provider = createVideoGenerationProvider({
      AI_PROVIDER_MODE: "live",
      FILMING_AI_MODE: "mock",
      REAPI_API_KEY: "rk_live_secret",
    });
    const submitted = await provider.submit({
      prompt: "Presenter speaks to camera.",
      aspectRatio: "9:16",
      durationSeconds: 30,
      imageUrls: [],
      videoUrls: [],
    });
    await provider.getStatus(submitted.id);
    await provider.getResult(submitted.id);
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("live mode without a key does not silently mock", async () => {
  let called = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    called += 1;
    throw new Error("should not fetch");
  }) as typeof fetch;
  try {
    const provider = createVideoGenerationProvider({ AI_PROVIDER_MODE: "live" });
    await assert.rejects(
      () =>
        provider.submit({
          prompt: "Presenter speaks to camera.",
          aspectRatio: "9:16",
          durationSeconds: 30,
          imageUrls: [],
          videoUrls: [],
        }),
      (error: unknown) => error instanceof Error && error.message === "Live filming is not connected yet.",
    );
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("reAPI adapter submits, polls, and downloads from recorded fixtures", async () => {
  const calls: { url: string; method: string; auth?: string; body?: unknown }[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      method,
      auth: headers.get("Authorization") ?? undefined,
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    });
    if (url === REAPI_VIDEOS_URL && method === "POST") {
      return jsonResponse({
        id: TASK_ID,
        model: SEEDANCE_MODEL_ID,
        status: "processing",
        output: null,
        error: null,
      });
    }
    if (url === TASK_URL && method === "GET") {
      return jsonResponse({
        id: TASK_ID,
        model: SEEDANCE_MODEL_ID,
        status: "completed",
        output: { video_urls: [VIDEO_URL] },
        error: null,
      });
    }
    if (url === VIDEO_URL) {
      return new Response(Buffer.from(FIXTURE_MP4), { headers: { "Content-Type": FIXTURE_VIDEO_MIME } });
    }
    return new Response("not found", { status: 404 });
  };

  const provider = createReapiVideoProvider({ apiKey: "rk_live_test_key", fetchImpl });
  const submitted = await provider.submit({
    prompt: "Presenter speaks to camera.",
    aspectRatio: "16:9",
    durationSeconds: 30,
    imageUrls: ["https://signed.example/front.jpg"],
    videoUrls: ["https://signed.example/voice.mp4"],
  });
  assert.equal(submitted.id, TASK_ID);
  assert.equal(submitted.status, "processing");
  const status = await provider.getStatus(TASK_ID);
  assert.equal(status.status, "complete");
  const result = await provider.getResult(TASK_ID);
  assert.equal(result.mimeType, FIXTURE_VIDEO_MIME);
  assert.deepEqual(result.bytes, FIXTURE_MP4);

  assert.equal(calls[0]?.url, REAPI_VIDEOS_URL);
  assert.equal(calls[0]?.method, "POST");
  assert.equal(calls[0]?.auth, "Bearer rk_live_test_key");
  const submitBody = calls[0]?.body as Record<string, unknown>;
  assert.equal(submitBody.model, "doubao-seedance-2.5-face");
  assert.equal(submitBody.resolution, "480p");
  assert.equal(submitBody.duration, 30);
  assert.equal(submitBody.generate_audio, true);
  assert.equal(submitBody.size, "16:9");
  assert.deepEqual(submitBody.image_urls, ["https://signed.example/front.jpg"]);
  assert.equal(calls[1]?.url, TASK_URL);
  assert.equal(calls[2]?.url, TASK_URL);
  assert.equal(calls[3]?.url, VIDEO_URL);
  for (const call of calls) {
    assert.doesNotMatch(JSON.stringify(call.body ?? {}), /720p|1080p/);
  }
});

test("reAPI adapter maps task failure without exposing vendor names", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.includes("/tasks/")) {
      return jsonResponse({
        id: TASK_ID,
        status: "failed",
        output: null,
        error: { code: 80003, message: "Seedance internal CUDA error" },
      });
    }
    return jsonResponse({ id: TASK_ID, status: "processing" });
  };
  const provider = createReapiVideoProvider({ apiKey: "rk_live_test_key", fetchImpl });
  const status = await provider.getStatus(TASK_ID);
  assert.equal(status.status, "failed");
  assert.equal(status.error, "We couldn't complete filming right now. Please try again later.");
  assert.doesNotMatch(status.error ?? "", /Seedance|reAPI|CUDA/i);
});

test("reAPI adapter treats rate limits as still processing", async () => {
  const fetchImpl: typeof fetch = async () => jsonResponse({ error: { code: 50001, message: "rate limit" } }, 429);
  const provider = createReapiVideoProvider({ apiKey: "rk_live_test_key", fetchImpl });
  const status = await provider.getStatus(TASK_ID);
  assert.equal(status.status, "processing");
  assert.equal(status.error, undefined);
});
