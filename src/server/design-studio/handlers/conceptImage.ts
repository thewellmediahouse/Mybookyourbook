import {
  errorResponse,
  extractAccessToken,
  methodNotAllowed,
} from '@/server/design-studio/http';
import { readAuthorizedConceptObject } from '@/server/design-studio/concepts';
import type { DesignStudioEnv } from '@/server/design-studio/types';

/**
 * GET /api/design-studio/concept-image/:conceptId
 * Streams a generated concept mockup after project token verification.
 * Does not expose the raw R2 object key.
 */
export async function handleConceptImage(
  request: Request,
  env: DesignStudioEnv,
  conceptId: string,
): Promise<Response> {
  if (request.method !== 'GET') {
    return methodNotAllowed(['GET']);
  }

  const token = extractAccessToken(request);
  if (!token) {
    return errorResponse(
      401,
      'missing_access_token',
      'A valid project access token is required.',
    );
  }

  try {
    const { row, object } = await readAuthorizedConceptObject(env, {
      conceptId,
      accessToken: token,
    });

    const headers = new Headers();
    headers.set('content-type', row.mime_type || 'image/png');
    headers.set('cache-control', 'private, max-age=300');
    headers.set(
      'content-disposition',
      `inline; filename="concept-${String(row.slot).padStart(2, '0')}"`,
    );
    if (typeof object.size === 'number') {
      headers.set('content-length', String(object.size));
    }

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'concept_image_failed';
    if (message === 'UNAUTHORIZED' || message === 'NOT_FOUND') {
      return errorResponse(404, 'concept_image_not_found', 'Concept image not found or access denied.');
    }
    if (message === 'R2_UNAVAILABLE') {
      return errorResponse(503, 'r2_unavailable', 'Concept storage is not configured.');
    }
    console.error('concept image fetch failed', message);
    return errorResponse(500, 'concept_image_failed', 'Unable to load concept image.');
  }
}
