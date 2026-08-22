"use server";

import { requireUser } from "@/lib/auth";
import { assertCanStartProduction, loadProjectAccess, loadWorkspaceMember } from "@/lib/authz";
import { getDb } from "@/lib/db/client";
import { attachProjectReference, detachProjectReference } from "@/lib/projects/references";
import { createDraftProject, updateDraftBrief, type BriefInput } from "@/lib/projects/save";
import { queueObjectCleanup } from "@/lib/security/cleanup";
import { ACTIVE_WORKSPACE_COOKIE, listUserWorkspaces } from "@/lib/workspaces/queries";
import { cookies } from "next/headers";

export type BriefSaveResult = { projectId?: string; error?: string };

async function requireDraftEditor(projectId?: string | null) {
  const session = await requireUser();
  const db = await getDb();
  const workspaces = await listUserWorkspaces(db, session.user.id);
  if (workspaces.length === 0) {
    throw new Error("You do not have access to that studio.");
  }
  const preferred = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const active = workspaces.find((item) => item.workspaceId === preferred) ?? workspaces[0];
  const member = await loadWorkspaceMember(db, session.user.id, active.workspaceId);
  assertCanStartProduction(member);
  if (projectId) {
    const access = await loadProjectAccess(db, session.user.id, projectId);
    assertCanStartProduction(access);
    return { db, userId: session.user.id, member, projectId, access };
  }
  return { db, userId: session.user.id, member, projectId: null, access: null };
}

export async function saveBriefAction(input: BriefInput & { projectId?: string | null }): Promise<BriefSaveResult> {
  try {
    const ctx = await requireDraftEditor(input.projectId);
    let projectId = ctx.projectId;
    if (!projectId) {
      if (!input.businessId) {
        return { error: "Choose which business this commercial is for." };
      }
      projectId = await createDraftProject(ctx.db, ctx.member, {
        businessId: input.businessId,
        createdByUserId: ctx.userId,
        title: input.title,
      });
      await updateDraftBrief(ctx.db, ctx.member, projectId, input);
      return { projectId };
    }
    if (!ctx.access) {
      return { error: "We couldn't save that brief." };
    }
    await updateDraftBrief(ctx.db, ctx.access, projectId, input);
    return { projectId };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't save that brief." };
  }
}

export async function attachLibraryReferenceAction(input: {
  projectId: string;
  assetId: string;
}): Promise<{ error?: string }> {
  try {
    const ctx = await requireDraftEditor(input.projectId);
    if (!ctx.access) {
      return { error: "We couldn't add that file." };
    }
    await attachProjectReference(ctx.db, {
      projectId: input.projectId,
      assetId: input.assetId,
      workspaceId: ctx.access.workspace.id,
    });
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't add that file." };
  }
}

export async function removeReferenceAction(input: {
  projectId: string;
  referenceId: string;
}): Promise<{ error?: string }> {
  try {
    const ctx = await requireDraftEditor(input.projectId);
    if (!ctx.access) {
      return { error: "We couldn't remove that file." };
    }
    const removed = await detachProjectReference(ctx.db, {
      projectId: input.projectId,
      referenceId: input.referenceId,
    });
    if (removed.objectKey) {
      await queueObjectCleanup(ctx.access.workspace.id, removed.objectKey);
    }
    return {};
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't remove that file." };
  }
}
