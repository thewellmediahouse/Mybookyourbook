import {
  errorResponse,
  extractAccessToken,
  methodNotAllowed,
} from '@/server/design-studio/http';
import { readAuthorizedUploadObject } from '@/server/design-studio/uploads';
import type { DesignStudioEnv } from '@/server/design-studio/types';

/**
 * GET /api/design-studio/asset/:uploadId
 * Streams private R2 object after project token verification.
 * Does not expose the raw R2 object key.
 */
export async function handleAsset(
  request: Request,
  env: DesignStudioEnv,
  uploadId: string,
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
    const { row, object } = await readAuthorizedUploadObject(env, {
      uploadId,
      accessToken: token,
    });

    const headers = new Headers();
    headers.set('content-type', row.mime_type || 'application/octet-stream');
    headers.set('cache-control', 'private, no-store');
    headers.set(
      'content-disposition',
      `inline; filename="${(row.original_filename || row.safe_filename).replace(/"/g, '')}"`,
    );
    if (typeof object.size === 'number') {
      headers.set('content-length', String(object.size));
    }

    return new Response(object.body, { status: 200, headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'asset_failed';
    if (message === 'UNAUTHORIZED' || message === 'NOT_FOUND') {
      return errorResponse(404, 'asset_not_found', 'Asset not found or access denied.');
    }
    if (message === 'R2_UNAVAILABLE') {
      return errorResponse(503, 'r2_unavailable', 'Upload storage is not configured.');
    }
    console.error('asset fetch failed', message);
    return errorResponse(500, 'asset_failed', 'Unable to load asset.');
  }
}
