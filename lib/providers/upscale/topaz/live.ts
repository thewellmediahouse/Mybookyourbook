import { FIXTURE_VIDEO_MIME } from "@/lib/providers/video/fixture";
import {
  isSafeTopazRequestId,
  resolveTopazModel,
  splitUploadParts,
  TOPAZ_API_BASE,
  topazCreateBody,
} from "./payload";
import type { UpscaleCreateInput, UpscaleJob, UpscaleProvider, UpscaleResult } from "./types";

const CUSTOMER_UNAVAILABLE = "We couldn't enhance your footage right now. Please try again later.";
const SOURCE_FRAME_RATE = 24;
const SOURCE_DURATION_SECONDS = 30;

type CreateResponse = { requestId?: unknown };
type AcceptResponse = { urls?: unknown };
type StatusResponse = {
  status?: unknown;
  download?: { url?: unknown };
};

const IN_FLIGHT = new Set([
  "requested",
  "accepted",
  "initializing",
  "preprocessing",
  "processing",
  "postprocessing",
]);

function header(apiKey: string, json = false): HeadersInit {
  const headers: Record<string, string> = {
    "X-API-Key": apiKey,
    accept: "application/json",
  };
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

function mapStatus(raw: string): UpscaleJob["status"] {
  if (raw === "complete") {
    return "complete";
  }
  if (raw === "failed" || raw === "canceled" || raw === "canceling") {
    return "failed";
  }
  if (raw === "accepted") {
    return "accepted";
  }
  if (IN_FLIGHT.has(raw)) {
    return "processing";
  }
  return "failed";
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    throw new Error(CUSTOMER_UNAVAILABLE);
  }
}

export function createTopazUpscaleProvider(input: {
  apiKey: string;
  model?: string;
  fetchImpl?: typeof fetch;
}): UpscaleProvider {
  const apiKey = input.apiKey.trim();
  const model = resolveTopazModel(input.model);
  const fetchImpl = input.fetchImpl ?? fetch;
  const etags = new Map<string, { partNum: number; eTag: string }[]>();

  async function statusOf(id: string): Promise<StatusResponse> {
    if (!isSafeTopazRequestId(id)) {
      throw new Error(CUSTOMER_UNAVAILABLE);
    }
    const response = await fetchImpl(`${TOPAZ_API_BASE}/video/${id}/status`, {
      method: "GET",
      headers: header(apiKey),
    });
    if (!response.ok) {
      throw new Error(CUSTOMER_UNAVAILABLE);
    }
    return (await readJson(response)) as StatusResponse;
  }

  async function poll(id: string): Promise<UpscaleJob> {
    const payload = await statusOf(id);
    const raw = typeof payload.status === "string" ? payload.status : "";
    return { id, status: mapStatus(raw) };
  }

  return {
    async create(createInput: UpscaleCreateInput): Promise<UpscaleJob> {
      if (!apiKey) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const response = await fetchImpl(`${TOPAZ_API_BASE}/video/`, {
        method: "POST",
        headers: header(apiKey, true),
        body: JSON.stringify(
          topazCreateBody({
            byteLength: createInput.sourceBytes.byteLength,
            aspectRatio: createInput.aspectRatio,
            durationSeconds: createInput.durationSeconds ?? SOURCE_DURATION_SECONDS,
            frameRate: SOURCE_FRAME_RATE,
            model,
          }),
        ),
      });
      if (!response.ok) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const payload = (await readJson(response)) as CreateResponse;
      const id = typeof payload.requestId === "string" ? payload.requestId.trim() : "";
      if (!isSafeTopazRequestId(id)) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      return { id, status: "created" };
    },

    async accept(id: string): Promise<UpscaleJob> {
      if (!isSafeTopazRequestId(id)) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const response = await fetchImpl(`${TOPAZ_API_BASE}/video/${id}/accept`, {
        method: "PATCH",
        headers: header(apiKey),
      });
      if (!response.ok) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const payload = (await readJson(response)) as AcceptResponse;
      const urls = Array.isArray(payload.urls)
        ? payload.urls.filter((url): url is string => typeof url === "string" && url.startsWith("https://"))
        : [];
      if (urls.length === 0) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      return { id, status: "accepted", uploadUrls: urls };
    },

    async upload(id: string, bytes: Uint8Array, uploadUrls?: string[]): Promise<UpscaleJob> {
      const urls = uploadUrls ?? [];
      if (urls.length === 0) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const parts = splitUploadParts(bytes, urls.length);
      const results: { partNum: number; eTag: string }[] = [];
      for (let index = 0; index < parts.length; index += 1) {
        const url = urls[index];
        if (!url?.startsWith("https://")) {
          throw new Error(CUSTOMER_UNAVAILABLE);
        }
        const part = parts[index];
        const response = await fetchImpl(url, {
          method: "PUT",
          headers: { "Content-Type": "video/mp4" },
          body: Buffer.from(part),
        });
        if (!response.ok) {
          throw new Error(CUSTOMER_UNAVAILABLE);
        }
        const eTag = response.headers.get("etag") || response.headers.get("ETag");
        if (!eTag) {
          throw new Error(CUSTOMER_UNAVAILABLE);
        }
        results.push({ partNum: index + 1, eTag });
      }
      etags.set(id, results);
      return { id, status: "uploading" };
    },

    async completeUpload(id: string): Promise<UpscaleJob> {
      if (!isSafeTopazRequestId(id)) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const uploadResults = etags.get(id);
      if (!uploadResults?.length) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const response = await fetchImpl(`${TOPAZ_API_BASE}/video/${id}/complete-upload`, {
        method: "PATCH",
        headers: header(apiKey, true),
        body: JSON.stringify({ uploadResults }),
      });
      if (!response.ok) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      etags.delete(id);
      return { id, status: "processing" };
    },

    poll,

    async complete(id: string): Promise<UpscaleJob> {
      const job = await poll(id);
      if (job.status !== "complete") {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      return job;
    },

    async retrieve(id: string): Promise<UpscaleResult> {
      const payload = await statusOf(id);
      const raw = typeof payload.status === "string" ? payload.status : "";
      if (mapStatus(raw) !== "complete") {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const url = typeof payload.download?.url === "string" ? payload.download.url : "";
      if (!url.startsWith("https://")) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const file = await fetchImpl(url);
      if (!file.ok) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      return {
        id,
        bytes,
        mimeType: file.headers.get("content-type") || FIXTURE_VIDEO_MIME,
      };
    },
  };
}
