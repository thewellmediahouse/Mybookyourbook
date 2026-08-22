"use server";

import { requireUser } from "@/lib/auth";
import { assertCanStartProduction, loadProjectAccess } from "@/lib/authz";
import { getDb } from "@/lib/db/client";
import { archiveProject, deleteProject, renameProject } from "@/lib/projects/manage";
import {
  createFormatVersion,
  createVariation,
  duplicateProject,
  type FormatVersionRatio,
} from "@/lib/projects/versions";
import { revalidatePath } from "next/cache";

export type CommercialActionResult = { error?: string; redirectTo?: string };

async function requireCommercialEditor(projectId: string) {
  const session = await requireUser();
  const db = await getDb();
  const access = await loadProjectAccess(db, session.user.id, projectId);
  assertCanStartProduction(access);
  return { db, access };
}

function fail(error: unknown): CommercialActionResult {
  return { error: error instanceof Error ? error.message : "We couldn't update that commercial." };
}

export async function duplicateCommercialAction(projectId: string): Promise<CommercialActionResult> {
  try {
    const ctx = await requireCommercialEditor(projectId);
    const id = await duplicateProject(ctx.db, ctx.access, projectId);
    return { redirectTo: `/dashboard/create?project=${id}` };
  } catch (error) {
    return fail(error);
  }
}

export async function createFormatVersionAction(
  projectId: string,
  ratio: FormatVersionRatio,
): Promise<CommercialActionResult> {
  try {
    const ctx = await requireCommercialEditor(projectId);
    const id = await createFormatVersion(ctx.db, ctx.access, projectId, ratio);
    return { redirectTo: `/dashboard/create?project=${id}` };
  } catch (error) {
    return fail(error);
  }
}

export async function createVariationAction(
  projectId: string,
  optionId: string,
): Promise<CommercialActionResult> {
  try {
    const ctx = await requireCommercialEditor(projectId);
    const id = await createVariation(ctx.db, ctx.access, projectId, optionId);
    return { redirectTo: `/dashboard/create?project=${id}` };
  } catch (error) {
    return fail(error);
  }
}

export async function renameCommercialAction(
  projectId: string,
  title: string,
): Promise<CommercialActionResult> {
  try {
    const ctx = await requireCommercialEditor(projectId);
    await renameProject(ctx.db, ctx.access, projectId, title);
    revalidatePath(`/dashboard/commercials/${projectId}`);
    revalidatePath("/dashboard/commercials");
    revalidatePath("/dashboard");
    return {};
  } catch (error) {
    return fail(error);
  }
}

export async function archiveCommercialAction(projectId: string): Promise<CommercialActionResult> {
  try {
    const ctx = await requireCommercialEditor(projectId);
    await archiveProject(ctx.db, ctx.access, projectId);
    revalidatePath(`/dashboard/commercials/${projectId}`);
    revalidatePath("/dashboard/commercials");
    revalidatePath("/dashboard");
    return {};
  } catch (error) {
    return fail(error);
  }
}

export async function deleteCommercialAction(projectId: string): Promise<CommercialActionResult> {
  try {
    const ctx = await requireCommercialEditor(projectId);
    await deleteProject(ctx.db, ctx.access, projectId);
    revalidatePath("/dashboard/commercials");
    revalidatePath("/dashboard");
    return { redirectTo: "/dashboard/commercials" };
  } catch (error) {
    return fail(error);
  }
}
