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

export function pickPlayableVideoAssetId(
  jobs: Array<{ finalAssetId: string | null; sourceAssetId: string | null; status: string }>,
): string | null {
  for (const job of jobs) {
    if (job.finalAssetId) {
      return job.finalAssetId;
    }
  }
  for (const job of jobs) {
    if (job.status === "COMPLETE" && job.sourceAssetId) {
      return job.sourceAssetId;
    }
  }
  return null;
}
