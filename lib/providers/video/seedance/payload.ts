import type { VideoSubmitInput } from "./types";

/** Official reAPI Seedance 2.5 model id. */
export const SEEDANCE_MODEL_ID = "doubao-seedance-2.5-face";
export const REAPI_API_BASE = "https://reapi.ai/api/v1";
export const REAPI_VIDEOS_URL = `${REAPI_API_BASE}/videos/generations`;
export const SEEDANCE_RESOLUTION = "480p" as const;
export const SEEDANCE_DURATION = 30 as const;

/** Official `size` enum except `adaptive`. Production30 never sends `adaptive` or `auto`. */
export const REAPI_SIZES = ["21:9", "16:9", "4:3", "1:1", "3:4", "9:16"] as const;
export type ReapiSize = (typeof REAPI_SIZES)[number];

export function reapiSize(value: string): ReapiSize {
  if ((REAPI_SIZES as readonly string[]).includes(value)) {
    return value as ReapiSize;
  }
  throw new Error("ASPECT_UNSUPPORTED");
}

export function isSafeReapiTaskId(id: string): boolean {
  return /^[A-Za-z0-9._-]{8,128}$/.test(id);
}

export function reapiTaskUrl(id: string): string {
  if (!isSafeReapiTaskId(id)) {
    throw new Error("TASK_ID_INVALID");
  }
  return `${REAPI_API_BASE}/tasks/${id}`;
}

export function seedanceSubmitBody(input: VideoSubmitInput): Record<string, unknown> {
  const body: Record<string, unknown> = {
    model: SEEDANCE_MODEL_ID,
    prompt: input.prompt,
    resolution: SEEDANCE_RESOLUTION,
    duration: SEEDANCE_DURATION,
    size: reapiSize(input.aspectRatio),
    generate_audio: true,
    output_format: "mp4",
  };
  if (input.imageUrls.length > 0) {
    body.image_urls = input.imageUrls.slice(0, 30);
  }
  if (input.videoUrls.length > 0) {
    body.video_urls = input.videoUrls.slice(0, 10);
  }
  return body;
}
