import {
  buildTeamHandoff,
  listTeamProjects,
} from '@/server/design-studio/handoff';
import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
} from '@/server/design-studio/http';
import { authorizeTeamAccess } from '@/server/design-studio/teamAuth';
import type { DesignStudioEnv } from '@/server/design-studio/types';

/**
 * GET /api/design-studio/internal/projects
 * Team-only project list (Cloudflare Access or DESIGN_STUDIO_TEAM_TOKEN).
 */
export async function handleInternalProjects(
  request: Request,
  env: DesignStudioEnv,
): Promise<Response> {
  if (request.method !== 'GET') {
    return methodNotAllowed(['GET']);
  }

  const auth = authorizeTeamAccess(env, request);
  if (!auth.ok) {
    const status = auth.code === 'team_auth_not_configured' ? 503 : 401;
    return errorResponse(status, auth.code, auth.message);
  }

  const url = new URL(request.url);
  const statusFilter = url.searchParams.get('status');

  try {
    const projects = await listTeamProjects(env, statusFilter);
    return jsonResponse({ ok: true, projects });
  } catch (error) {
    console.error(
      'internal projects list failed',
      error instanceof Error ? error.message : 'unknown',
    );
    return errorResponse(500, 'list_failed', 'Unable to list Design Studio projects.');
  }
}

/**
 * GET /api/design-studio/internal/handoff/:projectId
 * Full team handoff package for a paid/ready project.
 */
export async function handleInternalHandoff(
  request: Request,
  env: DesignStudioEnv,
  projectId: string,
): Promise<Response> {
  if (request.method !== 'GET') {
    return methodNotAllowed(['GET']);
  }

  const auth = authorizeTeamAccess(env, request);
  if (!auth.ok) {
    const status = auth.code === 'team_auth_not_configured' ? 503 : 401;
    return errorResponse(status, auth.code, auth.message);
  }

  try {
    const handoff = await buildTeamHandoff(env, projectId);
    if (!handoff) {
      return errorResponse(404, 'project_not_found', 'Project not found.');
    }
    return jsonResponse({ ok: true, handoff });
  } catch (error) {
    console.error(
      'internal handoff failed',
      error instanceof Error ? error.message : 'unknown',
    );
    return errorResponse(500, 'handoff_failed', 'Unable to build team handoff package.');
  }
}
