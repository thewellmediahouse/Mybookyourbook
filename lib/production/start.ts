import { desc, eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { generationAttempts, productionJobs } from "@/lib/db/schema";
import { CreditError } from "@/lib/credits/errors";
import { reserveGenerationCredit } from "@/lib/credits/ledger";
import { refundTechnicalFailure } from "@/lib/credits/ledger";
import { generationIdempotencyKey } from "@/lib/credits/copy";
import { newId } from "@/lib/id";
import { CUSTOMER_FAILURE, DUPLICATE_PRODUCTION } from "./copy";
import { ProductionError } from "./errors";
import { appendProductionEvent, setJobStatus } from "./events";
import { immediateStep, runCommercialProduction, type PipelineDeps, type ProductionParams } from "./pipeline";
import { getInFlightJob, getJobById, validateReadyToProduce } from "./queries";

export type WorkflowStarter = (params: ProductionParams) => Promise<{ id: string }>;

export async function startProduction(
  db: Db,
  input: {
    projectId: string;
    workspaceId: string;
    userId: string;
  },
  deps: PipelineDeps & { startWorkflow: WorkflowStarter },
) {
  const { project } = await validateReadyToProduce(db, input);
  const inFlight = await getInFlightJob(db, input.projectId);
  if (inFlight) {
    throw new ProductionError("DUPLICATE", DUPLICATE_PRODUCTION);
  }

  const [latest] = await db
    .select({ attemptNumber: productionJobs.attemptNumber })
    .from(productionJobs)
    .where(eq(productionJobs.projectId, input.projectId))
    .orderBy(desc(productionJobs.attemptNumber))
    .limit(1);
  const attemptNumber = (latest?.attemptNumber ?? 0) + 1;
  const jobId = newId();
  const attemptId = newId();
  const now = new Date();

  let credit;
  try {
    credit = await reserveGenerationCredit(db, {
      workspaceId: input.workspaceId,
      projectId: input.projectId,
      attemptId,
    });
  } catch (error) {
    if (error instanceof CreditError) {
      throw new ProductionError("NO_CREDITS", error.message);
    }
    throw error;
  }

  await db.insert(productionJobs).values({
    id: jobId,
    workspaceId: input.workspaceId,
    projectId: input.projectId,
    creativeVersionId: project.currentCreativeVersionId as string,
    status: "PRODUCTION_STARTING",
    creditTransactionId: credit.id,
    attemptNumber,
    startedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(generationAttempts).values({
    id: attemptId,
    projectId: input.projectId,
    jobId,
    attemptNumber,
    provider: "seedance",
    creativeVersionId: project.currentCreativeVersionId as string,
    creditTransactionId: credit.id,
    reason: "produce",
    result: "started",
    createdAt: now,
  });
  await appendProductionEvent(db, { jobId, type: "JOB_CREATED" });
  await appendProductionEvent(db, { jobId, type: "CREDIT_RESERVED", payload: { creditId: credit.id } });
  await setJobStatus(db, {
    jobId,
    projectId: input.projectId,
    status: "PRODUCTION_STARTING",
  });

  const params: ProductionParams = {
    jobId,
    projectId: input.projectId,
    workspaceId: input.workspaceId,
    userId: input.userId,
    businessId: project.businessId,
    creativeVersionId: project.currentCreativeVersionId as string,
    attemptId,
  };

  try {
    const instance = await deps.startWorkflow(params);
    await db
      .update(productionJobs)
      .set({
        workflowInstanceId: instance.id,
        updatedAt: new Date(),
      })
      .where(eq(productionJobs.id, jobId));
  } catch (error) {
    const existing = await getJobById(db, jobId);
    if (existing?.status === "FAILED" || existing?.status === "COMPLETE") {
      throw new ProductionError("FAILED", existing.customerFailureMessage ?? CUSTOMER_FAILURE);
    }
    await refundTechnicalFailure(db, {
      workspaceId: input.workspaceId,
      generationIdempotencyKey: generationIdempotencyKey(input.projectId, attemptId),
    }).catch(() => null);
    await setJobStatus(db, {
      jobId,
      projectId: input.projectId,
      status: "FAILED",
      patch: {
        failureType: "workflow",
        internalFailureMessage: error instanceof Error ? error.message : String(error),
        customerFailureMessage: "We couldn't start filming. Your Ad Credit has not been lost.",
      },
    });
    throw error;
  }

  return { jobId, attemptId, productionPath: `/dashboard/commercials/${input.projectId}/production` };
}

export function inlineWorkflowStarter(deps: PipelineDeps): WorkflowStarter {
  return async (params) => {
    await runCommercialProduction(deps, params, immediateStep());
    return { id: params.jobId };
  };
}
