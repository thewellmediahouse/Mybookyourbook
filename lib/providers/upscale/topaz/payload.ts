export const TOPAZ_API_BASE = "https://api.topazlabs.com";
export const TOPAZ_DEFAULT_MODEL = "prob-4";

/** Official UpscaleFilter `model` enum from Topaz Video API create-request. */
export const TOPAZ_UPSCALE_MODELS = [
  "aaa-9",
  "ahq-12",
  "alq-13",
  "alqs-2",
  "amq-13",
  "amqs-2",
  "color-1",
  "ddv-3",
  "dtd-4",
  "dtds-2",
  "dtv-4",
  "dtvs-2",
  "gcg-5",
  "ghq-5",
  "iris-2",
  "iris-3",
  "nxf-1",
  "nxl-1",
  "nxhf-1",
  "nyx-3",
  "prob-4",
  "rhea-1",
  "thd-3",
  "thf-4",
  "thm-2",
] as const;

export type TopazUpscaleModel = (typeof TOPAZ_UPSCALE_MODELS)[number];

export type PixelSize = { width: number; height: number };

export function isSafeTopazRequestId(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}

export function resolveTopazModel(value: string | undefined): TopazUpscaleModel {
  const trimmed = value?.trim();
  if (trimmed && (TOPAZ_UPSCALE_MODELS as readonly string[]).includes(trimmed)) {
    return trimmed as TopazUpscaleModel;
  }
  return TOPAZ_DEFAULT_MODEL;
}

export function source480pSize(aspectRatio: string): PixelSize {
  if (aspectRatio === "16:9") {
    return { width: 854, height: 480 };
  }
  if (aspectRatio === "1:1") {
    return { width: 480, height: 480 };
  }
  return { width: 480, height: 854 };
}

export function output1080pSize(aspectRatio: string): PixelSize {
  if (aspectRatio === "16:9") {
    return { width: 1920, height: 1080 };
  }
  if (aspectRatio === "1:1") {
    return { width: 1080, height: 1080 };
  }
  return { width: 1080, height: 1920 };
}

export function topazCreateBody(input: {
  byteLength: number;
  aspectRatio: string;
  durationSeconds: number;
  frameRate: number;
  model: TopazUpscaleModel;
}): Record<string, unknown> {
  const source = source480pSize(input.aspectRatio);
  const output = output1080pSize(input.aspectRatio);
  const duration = input.durationSeconds;
  const frameRate = input.frameRate;
  return {
    source: {
      container: "mp4",
      size: input.byteLength,
      duration,
      frameCount: Math.round(duration * frameRate),
      frameRate,
      resolution: source,
    },
    filters: [{ model: input.model }],
    output: {
      resolution: output,
      frameRate,
      audioCodec: "AAC",
      audioTransfer: "Copy",
      dynamicCompressionLevel: "High",
      container: "mp4",
      videoEncoder: "H264",
    },
  };
}

export function splitUploadParts(bytes: Uint8Array, partCount: number): Uint8Array[] {
  const count = Math.max(1, partCount);
  const partSize = Math.ceil(bytes.byteLength / count) || bytes.byteLength;
  const parts: Uint8Array[] = [];
  for (let index = 0; index < count; index += 1) {
    const start = Math.min(index * partSize, bytes.byteLength);
    const end = Math.min(start + partSize, bytes.byteLength);
    parts.push(bytes.subarray(start, end));
  }
  return parts;
}
