import { newId } from "@/lib/id";
import { FIXTURE_MP4, FIXTURE_VIDEO_MIME } from "../fixture";
import type {
  ProviderResult,
  ProviderStatus,
  ProviderSubmission,
  VideoGenerationProvider,
} from "./types";

export type MockVideoFailure = "submit" | "status" | "result" | null;

export function createMockVideoProvider(options?: {
  failure?: MockVideoFailure;
}): VideoGenerationProvider {
  const jobs = new Map<string, ProviderStatus>();
  const failure = options?.failure ?? null;

  return {
    async submit(): Promise<ProviderSubmission> {
      if (failure === "submit") {
        throw new Error("SEEDANCE_SUBMIT_FAILED");
      }
      const id = `mock-video-${newId()}`;
      const status: ProviderStatus = {
        id,
        status: failure === "status" ? "failed" : "complete",
        error: failure === "status" ? "SEEDANCE_STATUS_FAILED" : undefined,
      };
      jobs.set(id, status);
      return { id, status: status.status === "failed" ? "failed" : "queued" };
    },

    async getStatus(id: string): Promise<ProviderStatus> {
      const job = jobs.get(id);
      if (!job) {
        return { id, status: "failed", error: "SEEDANCE_MISSING" };
      }
      return job;
    },

    async getResult(id: string): Promise<ProviderResult> {
      if (failure === "result") {
        throw new Error("SEEDANCE_RESULT_FAILED");
      }
      const job = jobs.get(id);
      if (!job || job.status !== "complete") {
        throw new Error("SEEDANCE_RESULT_FAILED");
      }
      return { id, bytes: FIXTURE_MP4, mimeType: FIXTURE_VIDEO_MIME };
    },
  };
}
