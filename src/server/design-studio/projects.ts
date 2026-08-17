import {
  createProjectId,
  createPublicReference,
  generateAccessToken,
  hashAccessToken,
  verifyAccessToken,
} from '@/utils/design-studio/accessToken';
import {
  assertProjectStatusTransition,
  canTransitionProjectStatus,
} from '@/utils/design-studio/projectState';
import type { DesignBrief, DesignProjectStatus } from '@/types/designStudio';
import type {
  DesignStudioEnv,
  DesignStudioProjectRow,
  PublicDesignProject,
} from '@/server/design-studio/types';

function nowIso(): string {
  return new Date().toISOString();
}

function toPublicProject(row: DesignStudioProjectRow): PublicDesignProject {
  const { access_token_hash: _hash, ...rest } = row;
  let brief: unknown = {};
  try {
    brief = JSON.parse(row.brief_json || '{}');
  } catch {
    brief = {};
  }
  return { ...rest, brief };
}

export async function createDesignProject(
  env: DesignStudioEnv,
  input: {
    brief?: Partial<DesignBrief>;
    promptVersion?: string;
  } = {},
): Promise<{
  project: PublicDesignProject;
  accessToken: string;
}> {
  const id = createProjectId();
  const publicReference = createPublicReference();
  const accessToken = await generateAccessToken();
  const accessTokenHash = await hashAccessToken(accessToken);
  const brief = input.brief ?? {};
  const createdAt = nowIso();

  await env.DESIGN_STUDIO_DB.prepare(
    `INSERT INTO design_projects (
      id, public_reference, access_token_hash, status, prompt_version,
      business_name, industry, website_type, brief_json, created_at, updated_at
    ) VALUES (?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      id,
      publicReference,
      accessTokenHash,
      input.promptVersion ?? null,
      brief.businessName?.trim() || null,
      brief.industry || null,
      brief.websiteType || null,
      JSON.stringify(brief),
      createdAt,
      createdAt,
    )
    .run();

  const project = await getProjectById(env, id);
  if (!project) {
    throw new Error('Failed to load project after create.');
  }

  return { project: toPublicProject(project), accessToken };
}

export async function getProjectById(
  env: DesignStudioEnv,
  projectId: string,
): Promise<DesignStudioProjectRow | null> {
  return (
    (await env.DESIGN_STUDIO_DB.prepare(
      `SELECT * FROM design_projects WHERE id = ? LIMIT 1`,
    )
      .bind(projectId)
      .first<DesignStudioProjectRow>()) ?? null
  );
}

export async function authorizeProjectAccess(
  env: DesignStudioEnv,
  projectId: string,
  accessToken: string,
): Promise<DesignStudioProjectRow | null> {
  const row = await getProjectById(env, projectId);
  if (!row) return null;
  const valid = await verifyAccessToken(accessToken, row.access_token_hash);
  if (!valid) return null;
  return row;
}

export async function updateProjectBrief(
  env: DesignStudioEnv,
  projectId: string,
  brief: Partial<DesignBrief>,
  options: {
    status?: DesignProjectStatus;
    promptVersion?: string;
  } = {},
): Promise<PublicDesignProject> {
  const existing = await getProjectById(env, projectId);
  if (!existing) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  let nextStatus = existing.status as DesignProjectStatus;
  if (options.status && options.status !== existing.status) {
    assertProjectStatusTransition(existing.status as DesignProjectStatus, options.status);
    nextStatus = options.status;
  }

  const mergedBrief = {
    ...(safeParseBrief(existing.brief_json) as object),
    ...brief,
  };

  const updatedAt = nowIso();

  await env.DESIGN_STUDIO_DB.prepare(
    `UPDATE design_projects
     SET brief_json = ?,
         business_name = ?,
         industry = ?,
         website_type = ?,
         status = ?,
         prompt_version = COALESCE(?, prompt_version),
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      JSON.stringify(mergedBrief),
      (mergedBrief as DesignBrief).businessName?.trim() || null,
      (mergedBrief as DesignBrief).industry || null,
      (mergedBrief as DesignBrief).websiteType || null,
      nextStatus,
      options.promptVersion ?? null,
      updatedAt,
      projectId,
    )
    .run();

  const updated = await getProjectById(env, projectId);
  if (!updated) throw new Error('PROJECT_NOT_FOUND');
  return toPublicProject(updated);
}

export function getPublicProject(row: DesignStudioProjectRow): PublicDesignProject {
  return toPublicProject(row);
}

export { canTransitionProjectStatus };

function safeParseBrief(raw: string): unknown {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}
