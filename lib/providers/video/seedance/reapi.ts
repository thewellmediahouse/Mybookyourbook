import { FIXTURE_VIDEO_MIME } from "../fixture";
import { isSafeReapiTaskId, reapiTaskUrl, REAPI_VIDEOS_URL, seedanceSubmitBody } from "./payload";
import type { ProviderResult, ProviderStatus, ProviderSubmission, VideoGenerationProvider, VideoSubmitInput } from "./types";

const CUSTOMER_UNAVAILABLE = "We couldn't complete filming right now. Please try again later.";

type ReapiTaskResponse = {
  id?: unknown;
  task_id?: unknown;
  status?: unknown;
  output?: { video_urls?: unknown };
  error?: unknown;
};

function header(apiKey: string, json = false): HeadersInit {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
  };
  if (json) {
    headers["Content-Type"] = "application/json";
  }
  return headers;
}

function taskId(payload: ReapiTaskResponse): string {
  const id = typeof payload.id === "string" ? payload.id.trim() : "";
  const alt = typeof payload.task_id === "string" ? payload.task_id.trim() : "";
  return id || alt;
}

function mapTaskStatus(raw: string): ProviderStatus["status"] {
  if (raw === "processing") {
    return "processing";
  }
  if (raw === "completed") {
    return "complete";
  }
  return "failed";
}

function firstHttpsVideoUrl(payload: ReapiTaskResponse): string {
  const urls = payload.output?.video_urls;
  if (!Array.isArray(urls)) {
    return "";
  }
  const url = urls.find((item) => typeof item === "string" && item.startsWith("https://"));
  return typeof url === "string" ? url : "";
}

export function createReapiVideoProvider(input: {
  apiKey: string;
  fetchImpl?: typeof fetch;
}): VideoGenerationProvider {
  const apiKey = input.apiKey.trim();
  const fetchImpl = input.fetchImpl ?? fetch;

  async function readJson(response: Response): Promise<unknown> {
    try {
      return await response.json();
    } catch {
      throw new Error(CUSTOMER_UNAVAILABLE);
    }
  }

  async function fetchTask(id: string): Promise<{ httpStatus: number; payload: ReapiTaskResponse }> {
    if (!isSafeReapiTaskId(id)) {
      throw new Error(CUSTOMER_UNAVAILABLE);
    }
    const response = await fetchImpl(reapiTaskUrl(id), {
      method: "GET",
      headers: header(apiKey),
    });
    return { httpStatus: response.status, payload: (await readJson(response)) as ReapiTaskResponse };
  }

  return {
    async submit(submitInput: VideoSubmitInput): Promise<ProviderSubmission> {
      if (!apiKey) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const response = await fetchImpl(REAPI_VIDEOS_URL, {
        method: "POST",
        headers: header(apiKey, true),
        body: JSON.stringify(seedanceSubmitBody(submitInput)),
      });
      if (!response.ok) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const payload = (await readJson(response)) as ReapiTaskResponse;
      const id = taskId(payload);
      if (!isSafeReapiTaskId(id)) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const raw = typeof payload.status === "string" ? payload.status : "processing";
      const status = mapTaskStatus(raw);
      if (status === "failed") {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      return { id, status };
    },

    async getStatus(id: string): Promise<ProviderStatus> {
      try {
        const { httpStatus, payload } = await fetchTask(id);
        if (httpStatus === 429) {
          return { id, status: "processing" };
        }
        if (httpStatus !== 200) {
          return { id, status: "failed", error: CUSTOMER_UNAVAILABLE };
        }
        const raw = typeof payload.status === "string" ? payload.status : "";
        const status = mapTaskStatus(raw);
        return { id, status, error: status === "failed" ? CUSTOMER_UNAVAILABLE : undefined };
      } catch {
        return { id, status: "failed", error: CUSTOMER_UNAVAILABLE };
      }
    },

    async getResult(id: string): Promise<ProviderResult> {
      const { httpStatus, payload } = await fetchTask(id);
      if (httpStatus !== 200 || mapTaskStatus(typeof payload.status === "string" ? payload.status : "") !== "complete") {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const url = firstHttpsVideoUrl(payload);
      if (!url) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const file = await fetchImpl(url);
      if (!file.ok) {
        throw new Error(CUSTOMER_UNAVAILABLE);
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mimeType = file.headers.get("content-type") || FIXTURE_VIDEO_MIME;
      return { id, bytes, mimeType };
    },
  };
}
