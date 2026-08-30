import { test } from "node:test";
import assert from "node:assert/strict";
import { FIXTURE_MP4, FIXTURE_VIDEO_MIME } from "./video/fixture";
import {
  createTopazUpscaleProvider,
  createUpscaleProvider,
  output1080pSize,
  resolveTopazModel,
  source480pSize,
  splitUploadParts,
  TOPAZ_API_BASE,
  TOPAZ_DEFAULT_MODEL,
  topazCreateBody,
} from "./upscale/topaz";

const REQUEST_ID = "764cabcf-b745-4b3e-ae38-1200304cf45b";
const DOWNLOAD_URL = "https://cdn.example/enhanced-output.mp4";
const UPLOAD_URLS = [
  "https://upload.example/part-1",
  "https://upload.example/part-2",
  "https://upload.example/part-3",
];
const CUSTOMER_UNAVAILABLE = "We couldn't enhance your footage right now. Please try again later.";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function bodyBytes(body: BodyInit | null | undefined): Uint8Array {
  if (body instanceof Uint8Array) {
    return body;
  }
  throw new Error("expected binary upload body");
}

test("mock mode never calls Topaz even when a key is present", async () => {
  let called = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    called += 1;
    throw new Error("paid HTTP must not run in mock mode");
  }) as typeof fetch;
  try {
    const provider = createUpscaleProvider({
      AI_PROVIDER_MODE: "mock",
      TOPAZ_API_KEY: "topaz_secret",
    });
    const created = await provider.create({
      sourceBytes: FIXTURE_MP4,
      mimeType: FIXTURE_VIDEO_MIME,
      aspectRatio: "9:16",
      durationSeconds: 30,
    });
    await provider.accept(created.id);
    await provider.upload(created.id, FIXTURE_MP4, UPLOAD_URLS);
    await provider.completeUpload(created.id);
    const polled = await provider.poll(created.id);
    assert.equal(polled.status, "complete");
    const result = await provider.retrieve(created.id);
    assert.equal(result.mimeType, FIXTURE_VIDEO_MIME);
    assert.deepEqual(result.bytes, FIXTURE_MP4);
    assert.equal("url" in result, false);
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
    const provider = createUpscaleProvider({ AI_PROVIDER_MODE: "live" });
    await assert.rejects(
      () =>
        provider.create({
          sourceBytes: FIXTURE_MP4,
          mimeType: FIXTURE_VIDEO_MIME,
          aspectRatio: "9:16",
          durationSeconds: 30,
        }),
      (error: unknown) => error instanceof Error && error.message === "Live enhancement is not connected yet.",
    );
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("create body is Proteus 1080p with official source estimates", () => {
  const body = topazCreateBody({
    byteLength: FIXTURE_MP4.byteLength,
    aspectRatio: "9:16",
    durationSeconds: 30,
    frameRate: 24,
    model: "prob-4",
  });
  const source = body.source as { size: number; resolution: { width: number; height: number }; duration: number };
  const output = body.output as {
    resolution: { width: number; height: number };
    dynamicCompressionLevel: string;
    videoEncoder: string;
  };
  const filters = body.filters as { model: string }[];
  assert.equal(filters[0]?.model, TOPAZ_DEFAULT_MODEL);
  assert.equal(filters[0]?.model, "prob-4");
  assert.deepEqual(source.resolution, source480pSize("9:16"));
  assert.deepEqual(source.resolution, { width: 480, height: 854 });
  assert.equal(source.size, FIXTURE_MP4.byteLength);
  assert.equal(source.duration, 30);
  assert.deepEqual(output.resolution, output1080pSize("9:16"));
  assert.deepEqual(output.resolution, { width: 1080, height: 1920 });
  assert.equal(output.dynamicCompressionLevel, "High");
  assert.equal(output.videoEncoder, "H264");
  assert.notEqual(output.resolution.width, 3840);
  assert.equal(resolveTopazModel("not-a-model"), "prob-4");
  assert.deepEqual(output1080pSize("16:9"), { width: 1920, height: 1080 });
  assert.deepEqual(output1080pSize("1:1"), { width: 1080, height: 1080 });
});

test("Topaz adapter create, multipart upload, complete, and retrieve from recorded fixtures", async () => {
  const calls: { url: string; method: string; apiKey?: string | null; auth?: string | null; body?: unknown }[] = [];
  const putParts: Uint8Array[] = [];
  const fetchImpl: typeof fetch = async (input, init) => {
    const url = String(input);
    const method = init?.method ?? "GET";
    const headers = new Headers(init?.headers);
    calls.push({
      url,
      method,
      apiKey: headers.get("X-API-Key"),
      auth: headers.get("Authorization"),
      body: typeof init?.body === "string" ? JSON.parse(init.body) : undefined,
    });
    if (url === `${TOPAZ_API_BASE}/video/` && method === "POST") {
      return jsonResponse({ requestId: REQUEST_ID, estimates: { cost: [1, 2], time: [10, 20] } });
    }
    if (url === `${TOPAZ_API_BASE}/video/${REQUEST_ID}/accept` && method === "PATCH") {
      return jsonResponse({ uploadId: "upload-1", urls: UPLOAD_URLS });
    }
    if (UPLOAD_URLS.includes(url) && method === "PUT") {
      putParts.push(bodyBytes(init?.body ?? null));
      return new Response(null, { status: 200, headers: { ETag: `"etag-${putParts.length}"` } });
    }
    if (url === `${TOPAZ_API_BASE}/video/${REQUEST_ID}/complete-upload` && method === "PATCH") {
      return jsonResponse({ status: "processing" });
    }
    if (url === `${TOPAZ_API_BASE}/video/${REQUEST_ID}/status`) {
      return jsonResponse({
        status: "complete",
        download: { url: DOWNLOAD_URL, expiresIn: 86400, expiresAt: "2099-01-01T00:00:00Z" },
      });
    }
    if (url === DOWNLOAD_URL) {
      return new Response(Buffer.from(FIXTURE_MP4), { headers: { "Content-Type": FIXTURE_VIDEO_MIME } });
    }
    return new Response("not found", { status: 404 });
  };

  const provider = createTopazUpscaleProvider({
    apiKey: "topaz_test_key",
    model: "prob-4",
    fetchImpl,
  });
  const created = await provider.create({
    sourceBytes: FIXTURE_MP4,
    mimeType: FIXTURE_VIDEO_MIME,
    aspectRatio: "9:16",
    durationSeconds: 30,
  });
  assert.equal(created.id, REQUEST_ID);
  const accepted = await provider.accept(created.id);
  assert.deepEqual(accepted.uploadUrls, UPLOAD_URLS);
  await provider.upload(created.id, FIXTURE_MP4, accepted.uploadUrls);
  await provider.completeUpload(created.id);
  const polled = await provider.poll(created.id);
  assert.equal(polled.status, "complete");
  const result = await provider.retrieve(created.id);
  assert.equal(result.mimeType, FIXTURE_VIDEO_MIME);
  assert.deepEqual(result.bytes, FIXTURE_MP4);
  assert.equal("url" in result, false);
  assert.doesNotMatch(JSON.stringify({ ...result, bytes: undefined }), /https?:/);

  assert.equal(calls[0]?.url, `${TOPAZ_API_BASE}/video/`);
  assert.equal(calls[0]?.method, "POST");
  assert.equal(calls[0]?.apiKey, "topaz_test_key");
  assert.equal(calls[0]?.auth, null);
  const createBody = calls[0]?.body as {
    filters: { model: string }[];
    output: { resolution: { width: number; height: number }; dynamicCompressionLevel: string };
    source: { size: number };
  };
  assert.equal(createBody.filters[0]?.model, "prob-4");
  assert.deepEqual(createBody.output.resolution, { width: 1080, height: 1920 });
  assert.equal(createBody.output.dynamicCompressionLevel, "High");
  assert.equal(createBody.source.size, FIXTURE_MP4.byteLength);

  assert.equal(putParts.length, 3);
  const reconstructed = new Uint8Array(putParts.reduce((sum, part) => sum + part.byteLength, 0));
  let offset = 0;
  for (const part of putParts) {
    reconstructed.set(part, offset);
    offset += part.byteLength;
  }
  assert.deepEqual(reconstructed, FIXTURE_MP4);
  assert.deepEqual(
    splitUploadParts(FIXTURE_MP4, 3).map((part) => part.byteLength),
    putParts.map((part) => part.byteLength),
  );

  const completeCall = calls.find((call) => call.url.endsWith("/complete-upload"));
  assert.deepEqual(completeCall?.body, {
    uploadResults: [
      { partNum: 1, eTag: `"etag-1"` },
      { partNum: 2, eTag: `"etag-2"` },
      { partNum: 3, eTag: `"etag-3"` },
    ],
  });
});

test("Topaz adapter maps failed status without exposing vendor names", async () => {
  const fetchImpl: typeof fetch = async (input) => {
    const url = String(input);
    if (url.endsWith("/status")) {
      return jsonResponse({
        status: "failed",
        error: "Topaz CUDA kernel failed on prob-4",
        message: "internal encoder dump",
      });
    }
    return jsonResponse({ requestId: REQUEST_ID });
  };
  const provider = createTopazUpscaleProvider({ apiKey: "topaz_test_key", fetchImpl });
  const polled = await provider.poll(REQUEST_ID);
  assert.equal(polled.status, "failed");
  await assert.rejects(
    () => provider.retrieve(REQUEST_ID),
    (error: unknown) =>
      error instanceof Error &&
      error.message === CUSTOMER_UNAVAILABLE &&
      !/Topaz|CUDA|prob-4|encoder/i.test(error.message),
  );
});
