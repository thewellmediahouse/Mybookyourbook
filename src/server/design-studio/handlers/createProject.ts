import { DESIGN_STUDIO_PROMPT_VERSION } from '@/ai/design-studio/promptVersion';
import {
  errorResponse,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from '@/server/design-studio/http';
import { createDesignProject } from '@/server/design-studio/projects';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import type { DesignBrief } from '@/types/designStudio';

type CreateBody = {
  brief?: Partial<DesignBrief>;
};

/**
 * POST /api/design-studio/create-project
 * Creates an anonymous project and returns the raw access token once.
 */
export async function handleCreateProject(
  request: Request,
  env: DesignStudioEnv,
): Promise<Response> {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST']);
  }

  const body = await readJsonBody<CreateBody>(request);
  if (!body.ok) return body.response;

  try {
    const { project, accessToken } = await createDesignProject(env, {
      brief: body.value.brief,
      promptVersion: DESIGN_STUDIO_PROMPT_VERSION,
    });

    return jsonResponse(
      {
        projectId: project.id,
        publicReference: project.public_reference,
        accessToken,
        status: project.status,
        project,
      },
      201,
    );
  } catch (error) {
    console.error('create-project failed', error instanceof Error ? error.message : 'unknown');
    return errorResponse(500, 'create_failed', 'Unable to create design project.');
  }
}
