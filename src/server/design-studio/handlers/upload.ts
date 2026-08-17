import {
  errorResponse,
  extractAccessToken,
  jsonResponse,
  methodNotAllowed,
} from '@/server/design-studio/http';
import { createProjectUpload } from '@/server/design-studio/uploads';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { UPLOAD_LIMITS } from '@/utils/design-studio/uploads';

/** Multipart overhead allowance above max project bytes. */
const MAX_UPLOAD_REQUEST_BYTES = UPLOAD_LIMITS.maxProjectBytes + 2 * 1024 * 1024;

/**
 * POST /api/design-studio/upload
 * multipart/form-data: file, projectId, kind?
 */
export async function handleUpload(
  request: Request,
  env: DesignStudioEnv,
): Promise<Response> {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST']);
  }

  const token = extractAccessToken(request);
  if (!token) {
    return errorResponse(
      401,
      'missing_access_token',
      'A valid project access token is required.',
    );
  }

  if (!env.DESIGN_STUDIO_ASSETS) {
    return errorResponse(503, 'r2_unavailable', 'Upload storage is not configured.');
  }

  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > MAX_UPLOAD_REQUEST_BYTES) {
    return errorResponse(413, 'payload_too_large', 'Upload is too large for this project.');
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse(400, 'invalid_form', 'Expected multipart form data.');
  }

  const projectId = String(form.get('projectId') || '').trim();
  const kindHint = form.get('kind');
  const fileValue = form.get('file');

  if (!projectId) {
    return errorResponse(400, 'missing_project_id', 'projectId is required.');
  }

  if (!(fileValue instanceof File) || fileValue.size === 0) {
    return errorResponse(400, 'missing_file', 'A non-empty file is required.');
  }

  try {
    const upload = await createProjectUpload(env, {
      projectId,
      accessToken: token,
      file: fileValue,
      kindHint: typeof kindHint === 'string' ? kindHint : null,
    });
    return jsonResponse({ upload }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'upload_failed';
    if (message === 'UNAUTHORIZED') {
      return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
    }
    if (message === 'UPLOADS_LOCKED') {
      return errorResponse(
        409,
        'uploads_locked',
        'Uploads can only be changed before generation starts.',
      );
    }
    if (message === 'INVALID_MIME') {
      return errorResponse(400, 'invalid_mime', 'File type is not allowed.');
    }
    if (message === 'LOGO_LIMIT') {
      return errorResponse(400, 'logo_limit', 'Only one logo file is allowed.');
    }
    if (message === 'REFERENCE_LIMIT') {
      return errorResponse(400, 'reference_limit', 'Reference file limit reached.');
    }
    if (message === 'PROJECT_SIZE_LIMIT') {
      return errorResponse(400, 'project_size_limit', 'Project upload size limit reached.');
    }
    if (message.startsWith('VALIDATION:')) {
      return errorResponse(400, 'validation_failed', message.replace('VALIDATION:', ''));
    }
    if (message === 'R2_UNAVAILABLE') {
      return errorResponse(503, 'r2_unavailable', 'Upload storage is not configured.');
    }
    console.error('upload failed', message);
    return errorResponse(500, 'upload_failed', 'Unable to upload file.');
  }
}
