"use server";

import { requireUser } from "@/lib/auth";
import { assertCanStartProduction, loadProjectAccess, loadWorkspaceMember } from "@/lib/authz";
import { getDb } from "@/lib/db/client";
import { fetchPublicPageMeta } from "@/lib/importers/page-meta";
import { attachProjectReference, detachProjectReference } from "@/lib/projects/references";
import { createDraftProject, updateDraftBrief, type BriefInput } from "@/lib/projects/save";
import { queueObjectCleanup } from "@/lib/security/cleanup";
import { RateLimitError } from "@/lib/security/errors";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { buildStudioStart, type StudioStartInput } from "@/lib/studio/presets";
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

export async function previewWebsiteForAdvert(input: {
  websiteUrl: string;
}): Promise<{ title?: string; description?: string; url?: string; error?: string }> {
  try {
    const ctx = await requireDraftEditor();
    await assertRateLimit(ctx.db, "import", ctx.userId);
    const result = await fetchPublicPageMeta(input.websiteUrl);
    if (!result.ok) {
      return { error: result.reason };
    }
    return {
      title: result.meta.title,
      description: result.meta.description,
      url: result.meta.url,
    };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: error.message };
    }
    return { error: error instanceof Error ? error.message : "We couldn't read that page." };
  }
}

export async function startStudioAction(
  input: StudioStartInput,
): Promise<BriefSaveResult & { step?: string; lane?: string }> {
  try {
    const started = buildStudioStart(input);
    if (!started.ok) {
      return { error: started.error };
    }
    const saved = await saveBriefAction(started.patch);
    if (saved.error || !saved.projectId) {
      return saved;
    }
    return { projectId: saved.projectId, step: started.step, lane: started.lane };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't start that advert." };
  }
}

export async function attachLibraryReferenceAction(input: {
  projectId: string;
  assetId: string;
}): Promise<{ error?: string; referenceId?: string }> {
  try {
    const ctx = await requireDraftEditor(input.projectId);
    if (!ctx.access) {
      return { error: "We couldn't add that file." };
    }
    const attached = await attachProjectReference(ctx.db, {
      projectId: input.projectId,
      assetId: input.assetId,
      workspaceId: ctx.access.workspace.id,
    });
    return { referenceId: attached.referenceId };
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
