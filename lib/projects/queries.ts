import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets, projectReferences, projects } from "@/lib/db/schema";
import { parseToneJson, type ToneState } from "./brief";
import { CREATE_WIZARD_STATUSES } from "./status";

export type ProjectReferenceView = {
  id: string;
  assetId: string;
  mappingSlot: string;
  mimeType: string;
  source: "library" | "project";
};

export type BriefRecord = {
  id: string;
  workspaceId: string;
  businessId: string;
  title: string;
  objective: string;
  targetCustomer: string;
  problem: string;
  valueProposition: string;
  offer: string;
  ctaType: string;
  ctaValue: string;
  style: string;
  tones: ToneState["tones"];
  avoid: string;
  platform: string;
  aspectRatio: string;
  duration: number;
  status: string;
  updatedAt: Date;
  references: ProjectReferenceView[];
};

export async function getProjectBrief(db: Db, projectId: string): Promise<BriefRecord | null> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);
  if (!project) {
    return null;
  }
  const tones = parseToneJson(project.toneJson);
  const refs = await db
    .select({
      id: projectReferences.id,
      assetId: assets.id,
      mappingSlot: projectReferences.mappingSlot,
      mimeType: assets.mimeType,
      category: assets.category,
    })
    .from(projectReferences)
    .innerJoin(assets, eq(projectReferences.assetId, assets.id))
    .where(and(eq(projectReferences.projectId, projectId), isNull(assets.deletedAt)));

  return {
    id: project.id,
    workspaceId: project.workspaceId,
    businessId: project.businessId,
    title: project.title,
    objective: project.objective ?? "",
    targetCustomer: project.targetCustomer ?? "",
    problem: project.problem ?? "",
    valueProposition: project.valueProposition ?? "",
    offer: project.offer ?? "",
    ctaType: project.ctaType ?? "",
    ctaValue: project.ctaValue ?? "",
    style: project.style ?? "",
    tones: tones.tones,
    avoid: tones.avoid,
    platform: project.platform ?? "",
    aspectRatio: project.aspectRatio ?? "",
    duration: project.duration,
    status: project.status,
    updatedAt: project.updatedAt,
    references: refs.map((row) => ({
      id: row.id,
      assetId: row.assetId,
      mappingSlot: row.mappingSlot,
      mimeType: row.mimeType,
      source: row.category === "library" ? "library" : "project",
    })),
  };
}

export async function getLatestDraft(
  db: Db,
  workspaceId: string,
  userId: string,
): Promise<BriefRecord | null> {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(
      and(
        eq(projects.workspaceId, workspaceId),
        eq(projects.createdByUserId, userId),
        inArray(projects.status, [...CREATE_WIZARD_STATUSES]),
        isNull(projects.deletedAt),
      ),
    )
    .orderBy(desc(projects.updatedAt))
    .limit(1);
  if (!row) {
    return null;
  }
  return getProjectBrief(db, row.id);
}
