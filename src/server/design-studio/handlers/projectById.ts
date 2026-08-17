import { listConceptsForProject } from '@/server/design-studio/concepts';
import {
  errorResponse,
  extractAccessToken,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from '@/server/design-studio/http';
import {
  authorizeProjectAccess,
  getPublicProject,
  updateProjectBrief,
} from '@/server/design-studio/projects';
import { listActiveUploads } from '@/server/design-studio/uploads';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import type { DesignBrief, DesignProjectStatus } from '@/types/designStudio';

/** Client-writable statuses only — never PAID / READY_FOR_DESIGNER / etc. */
const CLIENT_WRITABLE_STATUSES = new Set<DesignProjectStatus>([
  'DRAFT',
  'READY_TO_GENERATE',
  'CANCELLED',
]);

type PatchBody = {
  brief?: Partial<DesignBrief>;
  status?: DesignProjectStatus;
};

/**
 * GET|PATCH /api/design-studio/project/:id
 * Requires access token via Authorization Bearer or X-Design-Studio-Token.
 * PATCH may update brief and only safe client statuses (not payment states).
 */
export async function handleProjectById(
  request: Request,
  env: DesignStudioEnv,
  projectId: string,
): Promise<Response> {
  if (request.method !== 'GET' && request.method !== 'PATCH') {
    return methodNotAllowed(['GET', 'PATCH']);
  }

  const token = extractAccessToken(request);
  if (!token) {
    return errorResponse(
      401,
      'missing_access_token',
      'A valid project access token is required.',
    );
  }

  const authorized = await authorizeProjectAccess(env, projectId, token);
  if (!authorized) {
    return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
  }

  if (request.method === 'GET') {
    const [uploads, concepts] = await Promise.all([
      listActiveUploads(env, projectId),
      listConceptsForProject(env, projectId),
    ]);
    return jsonResponse({
      project: getPublicProject(authorized),
      uploads,
      concepts,
    });
  }

  const body = await readJsonBody<PatchBody>(request);
  if (!body.ok) return body.response;

  if (!body.value.brief && !body.value.status) {
    return errorResponse(400, 'invalid_body', 'Provide brief and/or status to update.');
  }

  if (body.value.status !== undefined) {
    if (!CLIENT_WRITABLE_STATUSES.has(body.value.status)) {
      return errorResponse(
        403,
        'status_not_allowed',
        'This project status can only be changed by the server.',
      );
    }
  }

  try {
    const project = await updateProjectBrief(env, projectId, body.value.brief ?? {}, {
      status: body.value.status,
    });
    const [uploads, concepts] = await Promise.all([
      listActiveUploads(env, projectId),
      listConceptsForProject(env, projectId),
    ]);
    return jsonResponse({ project, uploads, concepts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'update_failed';
    if (message.startsWith('Invalid project status transition')) {
      return errorResponse(
        409,
        'invalid_transition',
        'That project status change is not allowed.',
      );
    }
    if (message === 'PROJECT_NOT_FOUND') {
      return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
    }
    console.error('project update failed', message);
    return errorResponse(500, 'update_failed', 'Unable to update design project.');
  }
}
