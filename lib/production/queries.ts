import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { getIdentityBundle } from "@/lib/identity/queries";
import { IDENTITY_SLOTS } from "@/lib/identity/slots";
import { productionJobs, projects } from "@/lib/db/schema";
import { CONCEPT_REQUIRED, CONSENT_REQUIRED, IDENTITY_REQUIRED } from "./copy";
import { ProductionError } from "./errors";
import { IN_FLIGHT_JOB_STATUSES } from "./status";

export async function getInFlightJob(db: Db, projectId: string) {
  const [row] = await db
    .select()
    .from(productionJobs)
    .where(
      and(eq(productionJobs.projectId, projectId), inArray(productionJobs.status, IN_FLIGHT_JOB_STATUSES)),
    )
    .orderBy(desc(productionJobs.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getLatestJob(db: Db, projectId: string) {
  const [row] = await db
    .select()
    .from(productionJobs)
    .where(eq(productionJobs.projectId, projectId))
    .orderBy(desc(productionJobs.createdAt))
    .limit(1);
  return row ?? null;
}

export async function getPlayableFinalJob(db: Db, projectId: string) {
  const latest = await getLatestJob(db, projectId);
  if (latest?.finalAssetId || (latest?.status === "COMPLETE" && latest.sourceAssetId)) {
    return latest;
  }
  const [complete] = await db
    .select()
    .from(productionJobs)
    .where(and(eq(productionJobs.projectId, projectId), eq(productionJobs.status, "COMPLETE")))
    .orderBy(desc(productionJobs.completedAt))
    .limit(1);
  return complete ?? null;
}

export async function getJobById(db: Db, jobId: string) {
  const [row] = await db.select().from(productionJobs).where(eq(productionJobs.id, jobId)).limit(1);
  return row ?? null;
}

export async function validateReadyToProduce(
  db: Db,
  input: { projectId: string; workspaceId: string; userId: string },
) {
  const [project] = await db.select().from(projects).where(eq(projects.id, input.projectId)).limit(1);
  if (!project || project.workspaceId !== input.workspaceId || project.deletedAt) {
    throw new ProductionError("NOT_FOUND", "That commercial is not available.");
  }
  if (project.status !== "READY_TO_PRODUCE" && project.status !== "FAILED") {
    if (project.status === "IN_PRODUCTION" || project.status === "ENHANCING" || project.status === "BRANDING" || project.status === "FINALISING") {
      throw new ProductionError("DUPLICATE", "This commercial is already being produced.");
    }
    throw new ProductionError("NOT_READY", CONCEPT_REQUIRED);
  }
  if (!project.currentCreativeVersionId) {
    throw new ProductionError("NOT_READY", CONCEPT_REQUIRED);
  }
  const identity = await getIdentityBundle(db, input.workspaceId, input.userId);
  if (!identity) {
    throw new ProductionError("IDENTITY", IDENTITY_REQUIRED);
  }
  for (const slot of IDENTITY_SLOTS) {
    if (!identity.assets[slot]) {
      throw new ProductionError("IDENTITY", IDENTITY_REQUIRED);
    }
  }
  if (!identity.consented) {
    throw new ProductionError("CONSENT", CONSENT_REQUIRED);
  }
  return { project, identity };
}
