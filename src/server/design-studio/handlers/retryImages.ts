import { OpenAIImageError } from '@/ai/design-studio/openaiImage';
import { listConceptsForProject } from '@/server/design-studio/concepts';
import { generateConceptImagesForProject } from '@/server/design-studio/generateConceptImages';
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
} from '@/server/design-studio/projects';
import { publicOpenAiErrorMessage } from '@/server/design-studio/publicErrors';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import type { DesignBrief } from '@/types/designStudio';

type RetryBody = {
  projectId?: string;
  /** Optional subset; defaults to all pending / retryable slots. */
  conceptIds?: string[];
  /**
   * Max slots to process in this request (default 1).
   * Keep small so Workers finish each image inside a single HTTP request.
   */
  limit?: number;
};

function needsVisualWork(concept: {
  hasImage: boolean;
  status: string;
  canRetry: boolean;
}): boolean {
  if (concept.hasImage) return false;
  return (
    concept.status === 'PENDING' ||
    concept.status === 'GENERATING' ||
    concept.canRetry
  );
}

/**
 * POST /api/design-studio/retry-images
 * Generates or retries concept visuals for PENDING / stuck GENERATING / failed slots.
 * Defaults to one image per call so Free-plan Workers are not killed mid-batch.
 */
export async function handleRetryImages(
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

  const body = await readJsonBody<RetryBody>(request, 20_000);
  if (!body.ok) return body.response;

  const projectId = body.value.projectId?.trim();
  if (!projectId) {
    return errorResponse(400, 'missing_project_id', 'projectId is required.');
  }

  const authorized = await authorizeProjectAccess(env, projectId, accessToken);
  if (!authorized) {
    return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
  }

  // Directions still streaming in — visuals wait until GENERATED.
  if (authorized.status === 'GENERATING') {
    return errorResponse(
      409,
      'generation_in_progress',
      'Concept directions are still generating. Visuals will follow automatically.',
    );
  }

  if (authorized.status !== 'GENERATED' && authorized.status !== 'FAILED') {
    return errorResponse(
      409,
      'invalid_project_state',
      'Image generation is only available after directions are ready.',
    );
  }

  if (!env.OPENAI_API_KEY) {
    return errorResponse(503, 'openai_not_configured', 'AI generation is not configured yet.');
  }

  const concepts = await listConceptsForProject(env, projectId);
  const eligible = concepts.filter(needsVisualWork);
  if (eligible.length === 0) {
    return errorResponse(
      409,
      'no_retryable_images',
      'There are no concept images left to generate or retry.',
    );
  }

  const requested = (body.value.conceptIds || [])
    .map((id) => id.trim())
    .filter(Boolean);
  const allowedIds = new Set(eligible.map((c) => c.id));
  let conceptIds =
    requested.length > 0
      ? requested.filter((id) => allowedIds.has(id))
      : eligible.map((c) => c.id);

  if (conceptIds.length === 0) {
    return errorResponse(
      400,
      'invalid_concept_ids',
      'None of the requested concepts are eligible for image generation.',
    );
  }

  const rawLimit = Number(body.value.limit);
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(Math.floor(rawLimit), 4) : 1;
  conceptIds = conceptIds.slice(0, limit);

  try {
    let brief = {} as DesignBrief;
    try {
      brief = JSON.parse(authorized.brief_json || '{}') as DesignBrief;
    } catch {
      brief = {} as DesignBrief;
    }

    const images = await generateConceptImagesForProject(env, {
      projectId,
      brief,
      conceptIds,
      concurrency: 1,
    });

    const refreshedConcepts = await listConceptsForProject(env, projectId);
    const refreshed = await authorizeProjectAccess(env, projectId, accessToken);
    const stillPending = refreshedConcepts.some(needsVisualWork);

    return jsonResponse({
      ok: true,
      status: refreshed?.status ?? authorized.status,
      project: refreshed ? getPublicProject(refreshed) : getPublicProject(authorized),
      concepts: refreshedConcepts,
      generation: {
        stage: stillPending ? 'images_pending' : 'images_ready',
        imagesPending: stillPending,
        images,
        message:
          images.failed > 0
            ? 'Some concept images still failed. Successful mockups were kept.'
            : stillPending
              ? 'Visual mockup updated. Remaining visuals are still generating.'
              : 'Concept visuals are ready.',
      },
    });
  } catch (error) {
    if (error instanceof OpenAIImageError) {
      return errorResponse(error.status, error.code, publicOpenAiErrorMessage(error));
    }
    console.error(
      'retry-images failed',
      error instanceof Error ? error.message : 'unknown',
    );
    return errorResponse(
      500,
      'retry_images_failed',
      'Unable to generate concept images. Please try again.',
    );
  }
}
