import {
  errorResponse,
  extractAccessToken,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from '@/server/design-studio/http';
import { selectProjectConcept } from '@/server/design-studio/selectConcept';
import type { DesignStudioEnv } from '@/server/design-studio/types';

type SelectBody = {
  projectId?: string;
  conceptId?: string;
};

/**
 * POST /api/design-studio/select-concept
 * Requires project access token. Saves selected_concept_id → CONCEPT_SELECTED.
 */
export async function handleSelectConcept(
  request: Request,
  env: DesignStudioEnv,
): Promise<Response> {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST']);
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(
      401,
      'missing_access_token',
      'A valid project access token is required.',
    );
  }

  const body = await readJsonBody<SelectBody>(request, 20_000);
  if (!body.ok) return body.response;

  const projectId = body.value.projectId?.trim();
  const conceptId = body.value.conceptId?.trim();

  if (!projectId) {
    return errorResponse(400, 'missing_project_id', 'projectId is required.');
  }
  if (!conceptId) {
    return errorResponse(400, 'missing_concept_id', 'conceptId is required.');
  }

  try {
    const result = await selectProjectConcept(env, {
      projectId,
      conceptId,
      accessToken,
    });

    return jsonResponse({
      ok: true,
      status: result.project.status,
      project: result.project,
      concepts: result.concepts,
      selectedConcept: result.selectedConcept,
      message: 'Direction selected. Next you will share contact details and confirm pricing.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'select_failed';

    if (message === 'UNAUTHORIZED') {
      return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
    }
    if (message === 'CONCEPT_NOT_FOUND' || message === 'PROJECT_NOT_FOUND') {
      return errorResponse(404, 'concept_not_found', 'Concept not found for this project.');
    }
    if (message.startsWith('SELECT_DENIED:')) {
      const parts = message.split(':');
      const code = parts[1] || 'select_denied';
      const detail = parts.slice(2).join(':') || 'Unable to select this concept.';
      const status = code === 'invalid_project_state' ? 409 : 400;
      return errorResponse(status, code, detail);
    }
    if (message.startsWith('Invalid project status transition')) {
      return errorResponse(
        409,
        'invalid_transition',
        'That project status change is not allowed.',
      );
    }

    console.error('select-concept failed', message);
    return errorResponse(500, 'select_failed', 'Unable to select this direction. Please try again.');
  }
}
