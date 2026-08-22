import { test } from "node:test";
import assert from "node:assert/strict";
import { FIXTURE_JPEG, FIXTURE_MP4, FIXTURE_VIDEO_MIME } from "./video/fixture";
import {
  brandingTextLines,
  createBrandingProvider,
  createContainerBrandingProvider,
  decodeBrandingEnvelope,
  encodeBrandingEnvelope,
  overlayLogoPosition,
  shouldIncludeEndCard,
} from "./branding";

const CUSTOMER_UNAVAILABLE = "We couldn't add your brand right now. Please try again later.";

test("branding lines use only provided profile fields and never invent copy", () => {
  assert.deepEqual(
    brandingTextLines({
      ctaValue: "Book Now",
      phone: "021 555 0100",
      whatsapp: "",
      website: " https://harbour.example ",
    }),
    ["Book Now", "021 555 0100", "https://harbour.example"],
  );
  assert.deepEqual(brandingTextLines({}), []);
  assert.equal(shouldIncludeEndCard([]), false);
  assert.equal(shouldIncludeEndCard(["Book Now"]), true);
  assert.doesNotMatch(brandingTextLines({ phone: "021 555 0100" }).join(" "), /Call Now|Get A Quote/i);
  assert.equal(overlayLogoPosition("bottom-right", false), "none");
  assert.equal(overlayLogoPosition("none", true), "none");
  assert.equal(overlayLogoPosition("top-left", true), "top-left");
});

test("mock mode never calls the media container even when a secret is present", async () => {
  let called = 0;
  const original = globalThis.fetch;
  globalThis.fetch = (async () => {
    called += 1;
    throw new Error("paid HTTP must not run in mock mode");
  }) as typeof fetch;
  try {
    const provider = createBrandingProvider({
      AI_PROVIDER_MODE: "mock",
      INTERNAL_SERVICE_SECRET: "internal_secret",
      requestContainer: async () => {
        called += 1;
        throw new Error("container must not run in mock mode");
      },
    });
    const result = await provider.apply({
      sourceBytes: FIXTURE_MP4,
      mimeType: FIXTURE_VIDEO_MIME,
      businessName: "Harbour Tours",
      ctaValue: "Book Now",
      logoPosition: "bottom-right",
    });
    assert.equal(result.mimeType, FIXTURE_VIDEO_MIME);
    assert.equal(result.media.videoCodec, null);
    assert.equal(called, 0);
  } finally {
    globalThis.fetch = original;
  }
});

test("live mode without a secret or container does not silently mock", async () => {
  const provider = createBrandingProvider({ AI_PROVIDER_MODE: "live" });
  await assert.rejects(
    () =>
      provider.apply({
        sourceBytes: FIXTURE_MP4,
        mimeType: FIXTURE_VIDEO_MIME,
        businessName: "Harbour Tours",
        logoPosition: "bottom-right",
      }),
    (error: unknown) =>
      error instanceof Error && error.message === "Adding your brand in post is not connected yet.",
  );
});

test("live branding adapter posts profile fields only and stores envelope bytes without vendor names", async () => {
  let options: Record<string, unknown> | undefined;
  const envelope = encodeBrandingEnvelope({
    meta: {
      width: 1080,
      height: 1920,
      durationSeconds: 30,
      fps: 24,
      videoCodec: "h264",
      audioCodec: "aac",
      container: "mp4",
      sizeBytes: FIXTURE_MP4.byteLength,
    },
    thumbnailBytes: FIXTURE_JPEG,
    videoBytes: FIXTURE_MP4,
  });
  const request = async (path: string, init?: RequestInit) => {
    assert.equal(path, "/brand");
    const headers = new Headers(init?.headers);
    assert.equal(headers.get("X-Internal-Secret"), "internal_secret");
    assert.equal(headers.get("Authorization"), null);
    const body = init?.body;
    assert.ok(body instanceof FormData);
    options = JSON.parse(String(body.get("options"))) as Record<string, unknown>;
    return new Response(Buffer.from(envelope), {
      headers: { "Content-Type": "application/octet-stream", "X-Thumbnail-Type": "image/jpeg" },
    });
  };
  const provider = createContainerBrandingProvider({ secret: "internal_secret", request });
  const result = await provider.apply({
    sourceBytes: FIXTURE_MP4,
    mimeType: FIXTURE_VIDEO_MIME,
    businessName: "Harbour Tours",
    ctaValue: "Book Now",
    phone: "021 555 0100",
    website: null,
    whatsapp: "  ",
    logoPosition: "bottom-right",
    logoBytes: FIXTURE_JPEG,
    logoMimeType: "image/jpeg",
  });
  assert.deepEqual(result.bytes, FIXTURE_MP4);
  assert.equal(result.media.width, 1080);
  assert.equal(result.media.height, 1920);
  assert.equal(result.media.videoCodec, "h264");
  assert.ok(options);
  assert.deepEqual(options.lines, ["Book Now", "021 555 0100"]);
  assert.equal(options.includeEndCard, true);
  assert.equal(options.logoPosition, "bottom-right");
  assert.doesNotMatch(JSON.stringify(options), /Call Now|Get A Quote|ffmpeg|FFmpeg|Topaz/i);
  const roundTrip = decodeBrandingEnvelope(envelope);
  assert.deepEqual(roundTrip.videoBytes, FIXTURE_MP4);
});

test("live branding maps container failure without exposing internals", async () => {
  const provider = createContainerBrandingProvider({
    secret: "internal_secret",
    request: async () => new Response("ffmpeg CUDA dump", { status: 500 }),
  });
  await assert.rejects(
    () =>
      provider.apply({
        sourceBytes: FIXTURE_MP4,
        mimeType: FIXTURE_VIDEO_MIME,
        businessName: "Harbour Tours",
        logoPosition: "none",
      }),
    (error: unknown) =>
      error instanceof Error &&
      error.message === CUSTOMER_UNAVAILABLE &&
      !/ffmpeg|CUDA|container/i.test(error.message),
  );
});
