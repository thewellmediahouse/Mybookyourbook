import { and, eq, isNull } from "drizzle-orm";
import { assertCanStartProduction } from "@/lib/authz/guards";
import type { WorkspaceAuthz } from "@/lib/authz/guards";
import type { Db } from "@/lib/db/client";
import { businesses, projects } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import {
  DEFAULT_DURATION,
  isAdStyle,
  isAdvertisingType,
  isAspectRatio,
  isCtaType,
  isDuration,
  isPlatformOption,
  serializeToneJson,
  type ToneOption,
} from "./brief";

export type BriefInput = {
  businessId?: string;
  title?: string;
  objective?: string;
  targetCustomer?: string;
  problem?: string;
  valueProposition?: string;
  offer?: string;
  ctaType?: string;
  ctaValue?: string;
  style?: string;
  tones?: ToneOption[];
  avoid?: string;
  platform?: string;
  aspectRatio?: string;
  duration?: number;
};

export async function createDraftProject(
  db: Db,
  ctx: WorkspaceAuthz,
  input: { businessId: string; createdByUserId: string; title?: string },
) {
  assertCanStartProduction(ctx);
  const [brand] = await db
    .select({ id: businesses.id, workspaceId: businesses.workspaceId })
    .from(businesses)
    .where(eq(businesses.id, input.businessId))
    .limit(1);
  if (!brand || brand.workspaceId !== ctx.workspace.id) {
    throw new Error("That brand does not belong to this studio.");
  }
  const now = new Date();
  const id = newId();
  const title = input.title?.trim() || "Untitled commercial";
  await db.insert(projects).values({
    id,
    workspaceId: ctx.workspace.id,
    businessId: brand.id,
    createdByUserId: input.createdByUserId,
    title,
    duration: DEFAULT_DURATION,
    status: "DRAFT",
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateDraftBrief(
  db: Db,
  ctx: WorkspaceAuthz,
  projectId: string,
  patch: BriefInput,
) {
  assertCanStartProduction(ctx);
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
    .limit(1);
  if (!project || project.workspaceId !== ctx.workspace.id) {
    throw new Error("You do not have access to that commercial.");
  }
  if (project.status !== "DRAFT" && project.status !== "AWAITING_APPROVAL") {
    throw new Error("This brief is locked because the concept is already approved.");
  }

  if (patch.businessId) {
    const [brand] = await db
      .select({ id: businesses.id, workspaceId: businesses.workspaceId })
      .from(businesses)
      .where(eq(businesses.id, patch.businessId))
      .limit(1);
    if (!brand || brand.workspaceId !== ctx.workspace.id) {
      throw new Error("That brand does not belong to this studio.");
    }
  }

  const objective = patch.objective !== undefined
    ? (patch.objective && !isAdvertisingType(patch.objective) ? "" : patch.objective)
    : undefined;
  const ctaType = patch.ctaType !== undefined
    ? (patch.ctaType && !isCtaType(patch.ctaType) ? "" : patch.ctaType)
    : undefined;
  const style = patch.style !== undefined
    ? (patch.style && !isAdStyle(patch.style) ? "" : patch.style)
    : undefined;
  const platform = patch.platform !== undefined
    ? (patch.platform && !isPlatformOption(patch.platform) ? "" : patch.platform)
    : undefined;
  if (patch.aspectRatio !== undefined && patch.aspectRatio !== "" && !isAspectRatio(patch.aspectRatio)) {
    throw new Error("Choose 9:16, 16:9, or 1:1. We do not pick the shape for you.");
  }
  if (patch.duration !== undefined && !isDuration(patch.duration)) {
    throw new Error("Choose 15, 20, or 30 seconds.");
  }

  const toneJson =
    patch.tones !== undefined || patch.avoid !== undefined
      ? serializeToneJson({
          tones: patch.tones ?? [],
          avoid: patch.avoid ?? "",
        })
      : undefined;

  const now = new Date();
  await db
    .update(projects)
    .set({
      ...(patch.businessId ? { businessId: patch.businessId } : {}),
      ...(patch.title !== undefined ? { title: patch.title.trim() || "Untitled commercial" } : {}),
      ...(objective !== undefined ? { objective: objective || null } : {}),
      ...(patch.targetCustomer !== undefined ? { targetCustomer: patch.targetCustomer.trim() || null } : {}),
      ...(patch.problem !== undefined ? { problem: patch.problem.trim() || null } : {}),
      ...(patch.valueProposition !== undefined
        ? { valueProposition: patch.valueProposition.trim() || null }
        : {}),
      ...(patch.offer !== undefined ? { offer: patch.offer.trim() || null } : {}),
      ...(ctaType !== undefined ? { ctaType: ctaType || null } : {}),
      ...(patch.ctaValue !== undefined ? { ctaValue: patch.ctaValue.trim() || null } : {}),
      ...(style !== undefined ? { style: style || null } : {}),
      ...(toneJson !== undefined ? { toneJson } : {}),
      ...(platform !== undefined ? { platform: platform || null } : {}),
      ...(patch.aspectRatio !== undefined ? { aspectRatio: patch.aspectRatio || null } : {}),
      ...(patch.duration !== undefined ? { duration: patch.duration } : {}),
      updatedAt: now,
    })
    .where(eq(projects.id, projectId));
}

export function briefReadyForConcept(input: {
  title: string;
  objective: string;
  ctaType: string;
  style: string;
  platform: string;
  aspectRatio: string;
  duration: number;
}): { ready: true } | { ready: false; reason: string } {
  if (!input.title.trim() || input.title.trim() === "Untitled commercial") {
    return { ready: false, reason: "Give this campaign a title." };
  }
  if (!isAdvertisingType(input.objective)) {
    return { ready: false, reason: "Choose what we are advertising." };
  }
  if (!isCtaType(input.ctaType)) {
    return { ready: false, reason: "Choose what customers should do after watching." };
  }
  if (!isAdStyle(input.style)) {
    return { ready: false, reason: "Choose a visual style." };
  }
  if (!isPlatformOption(input.platform)) {
    return { ready: false, reason: "Choose where this advert will run." };
  }
  if (!isAspectRatio(input.aspectRatio)) {
    return { ready: false, reason: "Choose 9:16, 16:9, or 1:1. We do not pick the shape for you." };
  }
  if (!isDuration(input.duration)) {
    return { ready: false, reason: "Choose 15, 20, or 30 seconds." };
  }
  return { ready: true };
}
