import { newId } from "@/lib/id";
import { FIXTURE_MP4, FIXTURE_VIDEO_MIME } from "@/lib/providers/video/fixture";
import type { UpscaleJob, UpscaleProvider, UpscaleResult } from "./types";

export type MockUpscaleFailure =
  | "create"
  | "accept"
  | "upload"
  | "completeUpload"
  | "poll"
  | "complete"
  | "retrieve"
  | null;

export function createMockUpscaleProvider(options?: { failure?: MockUpscaleFailure }): UpscaleProvider {
  const jobs = new Map<string, UpscaleJob>();
  const failure = options?.failure ?? null;

  function requireJob(id: string): UpscaleJob {
    const job = jobs.get(id);
    if (!job) {
      throw new Error("TOPAZ_MISSING");
    }
    return job;
  }

  function fail(step: MockUpscaleFailure): void {
    if (failure === step) {
      throw new Error(`TOPAZ_${String(step).toUpperCase()}_FAILED`);
    }
  }

  return {
    async create(): Promise<UpscaleJob> {
      fail("create");
      const job: UpscaleJob = { id: `mock-upscale-${newId()}`, status: "created" };
      jobs.set(job.id, job);
      return job;
    },
    async accept(id: string): Promise<UpscaleJob> {
      fail("accept");
      const job = requireJob(id);
      job.status = "accepted";
      return job;
    },
    async upload(id: string): Promise<UpscaleJob> {
      fail("upload");
      const job = requireJob(id);
      job.status = "uploading";
      return job;
    },
    async completeUpload(id: string): Promise<UpscaleJob> {
      fail("completeUpload");
      const job = requireJob(id);
      job.status = "processing";
      return job;
    },
    async poll(id: string): Promise<UpscaleJob> {
      fail("poll");
      const job = requireJob(id);
      if (job.status === "processing") {
        job.status = "complete";
      }
      return job;
    },
    async complete(id: string): Promise<UpscaleJob> {
      fail("complete");
      const job = requireJob(id);
      job.status = "complete";
      return job;
    },
    async retrieve(id: string): Promise<UpscaleResult> {
      fail("retrieve");
      const job = requireJob(id);
      if (job.status !== "complete") {
        throw new Error("TOPAZ_RETRIEVE_FAILED");
      }
      return { id, bytes: FIXTURE_MP4, mimeType: FIXTURE_VIDEO_MIME };
    },
  };
}
