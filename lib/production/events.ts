import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { productionEvents, productionJobs, projects } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { projectStatusForJob, type JobStatus } from "./status";

export const PRODUCTION_EVENT_TYPES = [
  "JOB_CREATED",
  "CREDIT_RESERVED",
  "SEEDANCE_SUBMITTED",
  "SEEDANCE_COMPLETE",
  "SOURCE_SAVED",
  "TOPAZ_SUBMITTED",
  "TOPAZ_COMPLETE",
  "ENHANCED_SAVED",
  "BRANDING_STARTED",
  "FINAL_SAVED",
  "COMPLETE",
  "FAILED",
  "CREDIT_REFUNDED",
  "ADMIN_RETRY",
  "ADMIN_CANCEL",
] as const;

export type ProductionEventType = (typeof PRODUCTION_EVENT_TYPES)[number];

export async function appendProductionEvent(
  db: Db,
  input: { jobId: string; type: ProductionEventType; payload?: Record<string, unknown> },
) {
  await db.insert(productionEvents).values({
    id: newId(),
    jobId: input.jobId,
    type: input.type,
    payloadJson: input.payload ? JSON.stringify(input.payload) : null,
    createdAt: new Date(),
  });
}

export async function setJobStatus(
  db: Db,
  input: {
    jobId: string;
    projectId: string;
    status: JobStatus;
    patch?: Partial<{
      workflowInstanceId: string | null;
      videoProvider: string | null;
      videoProviderJobId: string | null;
      upscaleProvider: string | null;
      upscaleProviderJobId: string | null;
      sourceAssetId: string | null;
      enhancedAssetId: string | null;
      finalAssetId: string | null;
      failureType: string | null;
      failureCode: string | null;
      internalFailureMessage: string | null;
      customerFailureMessage: string | null;
    }>;
  },
) {
  const now = new Date();
  await db
    .update(productionJobs)
    .set({
      status: input.status,
      updatedAt: now,
      ...(input.status === "COMPLETE" || input.status === "FAILED" ? { completedAt: now } : {}),
      ...(input.patch ?? {}),
    })
    .where(eq(productionJobs.id, input.jobId));
  await db
    .update(projects)
    .set({
      status: projectStatusForJob(input.status),
      updatedAt: now,
    })
    .where(eq(projects.id, input.projectId));
}
