import {
  errorResponse,
  extractAccessToken,
  jsonResponse,
  methodNotAllowed,
} from '@/server/design-studio/http';
import { softDeleteUpload } from '@/server/design-studio/uploads';
import type { DesignStudioEnv } from '@/server/design-studio/types';

/**
 * DELETE /api/design-studio/upload/:uploadId
 */
export async function handleDeleteUpload(
  request: Request,
  env: DesignStudioEnv,
  uploadId: string,
): Promise<Response> {
  if (request.method !== 'DELETE') {
    return methodNotAllowed(['DELETE']);
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
    await softDeleteUpload(env, { uploadId, accessToken: token });
    return jsonResponse({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'delete_failed';
    if (message === 'UNAUTHORIZED' || message === 'NOT_FOUND') {
      return errorResponse(404, 'upload_not_found', 'Upload not found or access denied.');
    }
    if (message === 'UPLOADS_LOCKED') {
      return errorResponse(
        409,
        'uploads_locked',
        'Uploads can only be changed before generation starts.',
      );
    }
    console.error('delete upload failed', message);
    return errorResponse(500, 'delete_failed', 'Unable to remove upload.');
  }
}
