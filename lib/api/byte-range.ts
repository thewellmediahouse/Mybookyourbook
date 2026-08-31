export type BytesRange =
  | { kind: "all" }
  | { kind: "slice"; start: number; end: number }
  | { kind: "unsatisfiable" };

/** Official HTTP Range: one `bytes=start-end` or `bytes=-suffix` span. */
export function parseBytesRange(header: string | null | undefined, size: number): BytesRange {
  const raw = header?.trim();
  if (!raw) {
    return { kind: "all" };
  }
  if (size <= 0) {
    return { kind: "unsatisfiable" };
  }
  const match = /^bytes=(\d*)-(\d*)$/i.exec(raw);
  if (!match) {
    return { kind: "all" };
  }
  const startRaw = match[1] ?? "";
  const endRaw = match[2] ?? "";
  if (startRaw === "" && endRaw === "") {
    return { kind: "all" };
  }
  if (startRaw === "") {
    const suffix = Number(endRaw);
    if (!Number.isFinite(suffix) || suffix <= 0) {
      return { kind: "unsatisfiable" };
    }
    const start = Math.max(0, size - suffix);
    return { kind: "slice", start, end: size - 1 };
  }
  const start = Number(startRaw);
  if (!Number.isFinite(start) || start < 0 || start >= size) {
    return { kind: "unsatisfiable" };
  }
  const end = endRaw === "" ? size - 1 : Math.min(Number(endRaw), size - 1);
  if (!Number.isFinite(end) || end < start) {
    return { kind: "unsatisfiable" };
  }
  return { kind: "slice", start, end };
}

export function contentRangeHeader(start: number, end: number, size: number): string {
  return `bytes ${start}-${end}/${size}`;
}

/** One Worker Range slice stays small. A request with no Range is streamed as-is. */
export const MAX_PLAYBACK_RANGE_BYTES = 1024 * 1024;
/** Card preview plays only this many seconds of the filmed (smaller) file. */
export const STUDIO_PREVIEW_SECONDS = 3;

export function capBytesRange(range: BytesRange, size: number, maxBytes: number): BytesRange {
  if (range.kind === "unsatisfiable" || range.kind === "all") {
    return range;
  }
  if (size <= 0 || maxBytes <= 0) {
    return { kind: "unsatisfiable" };
  }
  const length = range.end - range.start + 1;
  if (length <= maxBytes) {
    return range;
  }
  return { kind: "slice", start: range.start, end: range.start + maxBytes - 1 };
}

export function pickPlayableVideoAssetId(
  jobs: Array<{
    finalAssetId: string | null;
    enhancedAssetId?: string | null;
    sourceAssetId: string | null;
    status: string;
  }>,
): string | null {
  for (const job of jobs) {
    if (job.finalAssetId) {
      return job.finalAssetId;
    }
  }
  for (const job of jobs) {
    if (job.enhancedAssetId) {
      return job.enhancedAssetId;
    }
  }
  for (const job of jobs) {
    if (job.status === "COMPLETE" && job.sourceAssetId) {
      return job.sourceAssetId;
    }
  }
  return null;
}

/** Mock branding writes a 1×1 JPEG (~334 bytes). That is not a usable card still. */
export const MIN_STUDIO_STILL_BYTES = 2048;

export function pickStudioStillAssetId(input: {
  thumbnailId: string | null;
  thumbnailBytes: number;
  referenceImageId: string | null;
  identityFrontId: string | null;
}): string | null {
  if (input.thumbnailId && input.thumbnailBytes >= MIN_STUDIO_STILL_BYTES) {
    return input.thumbnailId;
  }
  return input.referenceImageId ?? input.identityFrontId;
}

export function shouldBufferPrivateAsset(input: { mimeType: string; download: boolean }): boolean {
  return !input.download && input.mimeType.startsWith("image/");
}

/** Card preview uses the filmed file (smaller), not the enhanced finished file. */
export function pickPreviewVideoAssetId(
  jobs: Array<{
    finalAssetId: string | null;
    enhancedAssetId?: string | null;
    sourceAssetId: string | null;
    status: string;
  }>,
): string | null {
  for (const job of jobs) {
    if (job.status === "COMPLETE" && job.sourceAssetId) {
      return job.sourceAssetId;
    }
  }
  return pickPlayableVideoAssetId(jobs);
}
