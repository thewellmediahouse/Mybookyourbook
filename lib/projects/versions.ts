import { and, eq, isNull } from "drizzle-orm";
import { assertCanStartProduction, type WorkspaceAuthz } from "@/lib/authz/guards";
import type { Db } from "@/lib/db/client";
import { projectReferences, projects } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { isAdStyle, isAspectRatio } from "./brief";
import {
  assertNewAspectRatio,
  isVariationOptionId,
  variationStyle,
  VARIATION_OPTIONS,
  withTitleSuffix,
  type FormatVersionRatio,
} from "./delivery";
import { listProjectReferenceSlots } from "./references";

export {
  ALREADY_LANDSCAPE,
  ALREADY_VERTICAL,
  CREATE_ANOTHER_VERSION,
  CREATE_LANDSCAPE,
  CREATE_VARIATION,
  CREATE_VERTICAL,
  DUPLICATE,
  IN_PRODUCTION_LOCK,
  NEW_ASPECT_RATIO_NOTICE,
  VARIATION_OPTIONS,
  VERSION_CREDIT_NOTICE,
  alreadyThisFormatMessage,
  assertNewAspectRatio,
  isVariationOptionId,
  withTitleSuffix,
  type FormatVersionRatio,
  type VariationOptionId,
} from "./delivery";

export async function cloneProjectBrief(
  db: Db,
  ctx: WorkspaceAuthz,
  sourceId: string,
  patch: { title: string; aspectRatio?: string | null; style?: string | null },
): Promise<string> {
  assertCanStartProduction(ctx);
  const [source] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, sourceId), isNull(projects.deletedAt)))
    .limit(1);
  if (!source || source.workspaceId !== ctx.workspace.id) {
    throw new Error("You do not have access to that commercial.");
  }
  if (patch.aspectRatio !== undefined && patch.aspectRatio !== null && patch.aspectRatio !== "") {
    if (!isAspectRatio(patch.aspectRatio)) {
      throw new Error("Choose 9:16, 16:9, or 1:1. We do not pick the shape for you.");
    }
  }
  if (patch.style !== undefined && patch.style !== null && patch.style !== "" && !isAdStyle(patch.style)) {
    throw new Error("Choose a visual style.");
  }

  const now = new Date();
  const id = newId();
  const nextRatio = patch.aspectRatio !== undefined ? patch.aspectRatio : source.aspectRatio;
  const nextStyle = patch.style !== undefined ? patch.style : source.style;
  await db.insert(projects).values({
    id,
    workspaceId: source.workspaceId,
    businessId: source.businessId,
    createdByUserId: ctx.userId,
    title: patch.title.trim() || "Untitled commercial",
    objective: source.objective,
    targetCustomer: source.targetCustomer,
    problem: source.problem,
    valueProposition: source.valueProposition,
    offer: source.offer,
    ctaType: source.ctaType,
    ctaValue: source.ctaValue,
    style: nextStyle || null,
    toneJson: source.toneJson,
    platform: source.platform,
    aspectRatio: nextRatio || null,
    duration: source.duration,
    status: "DRAFT",
    currentCreativeVersionId: null,
    createdAt: now,
    updatedAt: now,
  });

  const refs = await listProjectReferenceSlots(db, sourceId);
  if (refs.length > 0) {
    await db.insert(projectReferences).values(
      refs.map((ref) => ({
        id: newId(),
        projectId: id,
        assetId: ref.assetId,
        mappingSlot: ref.mappingSlot,
        createdAt: now,
      })),
    );
  }
  return id;
}

export async function duplicateProject(db: Db, ctx: WorkspaceAuthz, sourceId: string) {
  const [source] = await db
    .select({ title: projects.title })
    .from(projects)
    .where(and(eq(projects.id, sourceId), isNull(projects.deletedAt)))
    .limit(1);
  if (!source) {
    throw new Error("You do not have access to that commercial.");
  }
  return cloneProjectBrief(db, ctx, sourceId, { title: withTitleSuffix(source.title, "copy") });
}

export async function createFormatVersion(
  db: Db,
  ctx: WorkspaceAuthz,
  sourceId: string,
  ratio: FormatVersionRatio,
) {
  const [source] = await db
    .select({ title: projects.title, aspectRatio: projects.aspectRatio })
    .from(projects)
    .where(and(eq(projects.id, sourceId), isNull(projects.deletedAt)))
    .limit(1);
  if (!source) {
    throw new Error("You do not have access to that commercial.");
  }
  assertNewAspectRatio(source.aspectRatio, ratio);
  const suffix = ratio === "9:16" ? "vertical" : "landscape";
  return cloneProjectBrief(db, ctx, sourceId, {
    title: withTitleSuffix(source.title, suffix),
    aspectRatio: ratio,
  });
}

export async function createVariation(
  db: Db,
  ctx: WorkspaceAuthz,
  sourceId: string,
  optionId: string,
) {
  if (!isVariationOptionId(optionId)) {
    throw new Error("Choose how this version should change.");
  }
  const option = VARIATION_OPTIONS.find((item) => item.id === optionId);
  if (!option) {
    throw new Error("Choose how this version should change.");
  }
  const [source] = await db
    .select({ title: projects.title })
    .from(projects)
    .where(and(eq(projects.id, sourceId), isNull(projects.deletedAt)))
    .limit(1);
  if (!source) {
    throw new Error("You do not have access to that commercial.");
  }
  const style = variationStyle(optionId);
  return cloneProjectBrief(db, ctx, sourceId, {
    title: withTitleSuffix(source.title, option.label),
    ...(style ? { style } : {}),
  });
}
