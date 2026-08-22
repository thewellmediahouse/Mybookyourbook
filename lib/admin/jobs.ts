import { eq } from "drizzle-orm";
import { assertAdminActor } from "@/lib/admin/access";
import { generationIdempotencyKey } from "@/lib/credits/copy";
import { refundTechnicalFailure } from "@/lib/credits/ledger";
import type { Db } from "@/lib/db/client";
import {
  assets,
  auditLogs,
  businesses,
  creativeVersions,
  generationAttempts,
  productionEvents,
  productionJobs,
  projects,
  user,
  workspaces,
} from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { notifyProductionFailed } from "@/lib/notifications/notify";
import { appendProductionEvent, setJobStatus } from "@/lib/production/events";
import { CUSTOMER_FAILURE } from "@/lib/production/copy";
import { immediateStep, runCommercialProduction, type PipelineDeps, type ProductionParams } from "@/lib/production/pipeline";
import { getJobById } from "@/lib/production/queries";
import { isInFlightJob, type JobStatus } from "@/lib/production/status";
import { GET_EXPIRES_SECONDS, signR2Request } from "@/lib/r2/sign";
import { readR2S3Config } from "@/lib/r2/env";

export type AdminJobActor = {
  userId: string;
  email: string;
  adminEmails: string[];
};

function requireStaff(actor: AdminJobActor) {
  assertAdminActor(actor.email, actor.adminEmails);
}

async function generationKeyForJob(db: Db, job: { id: string; projectId: string }) {
  const [attempt] = await db
    .select({ id: generationAttempts.id })
    .from(generationAttempts)
    .where(eq(generationAttempts.jobId, job.id))
    .limit(1);
  if (!attempt) {
    throw new Error("That production has no credit reservation to refund.");
  }
  return generationIdempotencyKey(job.projectId, attempt.id);
}

export async function getAdminJobDetail(db: Db, jobId: string) {
  const job = await getJobById(db, jobId);
  if (!job) {
    return null;
  }
  const [project] = await db.select().from(projects).where(eq(projects.id, job.projectId)).limit(1);
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, job.workspaceId)).limit(1);
  const [business] = project
    ? await db.select().from(businesses).where(eq(businesses.id, project.businessId)).limit(1)
    : [];
  const [customer] = project
    ? await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, project.createdByUserId))
        .limit(1)
    : [];
  const [creative] = await db
    .select()
    .from(creativeVersions)
    .where(eq(creativeVersions.id, job.creativeVersionId))
    .limit(1);
  const events = await db
    .select()
    .from(productionEvents)
    .where(eq(productionEvents.jobId, job.id));
  const attempts = await db
    .select()
    .from(generationAttempts)
    .where(eq(generationAttempts.jobId, job.id));
  const linkedAssets = await db
    .select({
      id: assets.id,
      category: assets.category,
      role: assets.role,
      r2ObjectKey: assets.r2ObjectKey,
      sizeBytes: assets.sizeBytes,
    })
    .from(assets)
    .where(eq(assets.projectId, job.projectId));
  return { job, project, workspace, business, customer, creative, events, attempts, assets: linkedAssets };
}

export async function adminRefundJob(db: Db, actor: AdminJobActor, jobId: string) {
  requireStaff(actor);
  const job = await getJobById(db, jobId);
  if (!job) {
    throw new Error("That production job was not found.");
  }
  if (job.status === "COMPLETE") {
    throw new Error("A finished commercial cannot be refunded from here.");
  }
  const key = await generationKeyForJob(db, job);
  const refund = await refundTechnicalFailure(db, {
    workspaceId: job.workspaceId,
    generationIdempotencyKey: key,
  });
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: job.workspaceId,
    action: "admin.credit_refunded",
    targetType: "production_job",
    targetId: job.id,
    metadataJson: JSON.stringify({ refundId: refund.id }),
    createdAt: new Date(),
  });
  return refund;
}

export async function adminMarkTechnicalFailure(db: Db, actor: AdminJobActor, jobId: string) {
  requireStaff(actor);
  const job = await getJobById(db, jobId);
  if (!job) {
    throw new Error("That production job was not found.");
  }
  if (job.status === "COMPLETE") {
    throw new Error("A finished commercial cannot be marked as a technical failure.");
  }
  const [attempt] = await db
    .select()
    .from(generationAttempts)
    .where(eq(generationAttempts.jobId, job.id))
    .limit(1);
  const [project] = await db.select().from(projects).where(eq(projects.id, job.projectId)).limit(1);
  const refund = await adminRefundJob(db, actor, jobId);
  await setJobStatus(db, {
    jobId: job.id,
    projectId: job.projectId,
    status: "FAILED",
    patch: {
      failureType: "technical",
      failureCode: "ADMIN_TECHNICAL_FAILURE",
      internalFailureMessage: "Marked technical failure by staff.",
      customerFailureMessage: CUSTOMER_FAILURE,
    },
  });
  await appendProductionEvent(db, { jobId: job.id, type: "FAILED", payload: { refunded: true, admin: true } });
  if (project) {
    await notifyProductionFailed(
      db,
      {
        workspaceId: job.workspaceId,
        projectId: job.projectId,
        jobId: job.id,
        producerUserId: project.createdByUserId,
        refunded: true,
      },
      { appUrl: "http://localhost:3000" },
    ).catch(() => undefined);
  }
  void attempt;
  return { refundId: refund.id };
}

export async function adminCancelJob(db: Db, actor: AdminJobActor, jobId: string) {
  requireStaff(actor);
  const job = await getJobById(db, jobId);
  if (!job) {
    throw new Error("That production job was not found.");
  }
  if (job.status === "COMPLETE") {
    throw new Error("A finished commercial cannot be cancelled.");
  }
  if (job.status === "CANCELLED") {
    return job;
  }
  if (!isInFlightJob(job.status) && job.status !== "FAILED") {
    throw new Error("Only in-progress or failed jobs can be cancelled.");
  }
  await setJobStatus(db, {
    jobId: job.id,
    projectId: job.projectId,
    status: "CANCELLED",
    patch: {
      failureType: "cancelled",
      customerFailureMessage: CUSTOMER_FAILURE,
      internalFailureMessage: "Cancelled by staff.",
    },
  });
  await appendProductionEvent(db, { jobId: job.id, type: "ADMIN_CANCEL" });
  await adminRefundJob(db, actor, jobId).catch(() => null);
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: job.workspaceId,
    action: "admin.job_cancelled",
    targetType: "production_job",
    targetId: job.id,
    createdAt: new Date(),
  });
  return getJobById(db, jobId);
}

export async function adminRetryJob(
  db: Db,
  actor: AdminJobActor,
  jobId: string,
  deps: PipelineDeps & { startWorkflow: (params: ProductionParams) => Promise<{ id: string }> },
) {
  requireStaff(actor);
  const job = await getJobById(db, jobId);
  if (!job) {
    throw new Error("That production job was not found.");
  }
  if (job.status === "COMPLETE") {
    throw new Error("A finished commercial does not need a retry.");
  }
  const [attempt] = await db
    .select()
    .from(generationAttempts)
    .where(eq(generationAttempts.jobId, job.id))
    .limit(1);
  const [project] = await db.select().from(projects).where(eq(projects.id, job.projectId)).limit(1);
  if (!attempt || !project) {
    throw new Error("That production job cannot be retried yet.");
  }
  let status: JobStatus = "PRODUCTION_STARTING";
  if (job.enhancedAssetId) {
    status = "BRANDING";
  } else if (job.sourceAssetId) {
    status = "TOPAZ_PREPARING";
  }
  await setJobStatus(db, {
    jobId: job.id,
    projectId: job.projectId,
    status,
    patch: {
      failureType: null,
      failureCode: null,
      internalFailureMessage: null,
      customerFailureMessage: null,
    },
  });
  await appendProductionEvent(db, { jobId: job.id, type: "ADMIN_RETRY", payload: { status } });
  await db.insert(auditLogs).values({
    id: newId(),
    actorUserId: actor.userId,
    workspaceId: job.workspaceId,
    action: "admin.job_retried",
    targetType: "production_job",
    targetId: job.id,
    metadataJson: JSON.stringify({ status }),
    createdAt: new Date(),
  });
  const params: ProductionParams = {
    jobId: job.id,
    projectId: job.projectId,
    workspaceId: job.workspaceId,
    userId: project.createdByUserId,
    businessId: project.businessId,
    creativeVersionId: job.creativeVersionId,
    attemptId: attempt.id,
  };
  const instance = await deps.startWorkflow(params);
  await db
    .update(productionJobs)
    .set({ workflowInstanceId: instance.id, updatedAt: new Date() })
    .where(eq(productionJobs.id, job.id));
  return { jobId: job.id, workflowId: instance.id };
}

export async function adminSignedDownload(
  env: Record<string, unknown>,
  objectKey: string,
): Promise<{ url: string; expiresIn: number } | null> {
  const s3 = readR2S3Config(env);
  if (!s3) {
    return null;
  }
  const signed = await signR2Request(s3, { method: "GET", objectKey, expiresIn: GET_EXPIRES_SECONDS });
  return { url: signed.url, expiresIn: signed.expiresIn };
}

export function inlineAdminWorkflow(deps: PipelineDeps) {
  return async (params: ProductionParams) => {
    await runCommercialProduction(deps, params, immediateStep()).catch(() => undefined);
    return { id: params.jobId };
  };
}
