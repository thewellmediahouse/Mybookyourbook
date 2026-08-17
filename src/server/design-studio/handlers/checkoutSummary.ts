import { buildCheckoutSummary } from '@/server/design-studio/checkoutSummary';
import {
  errorResponse,
  extractAccessToken,
  jsonResponse,
  methodNotAllowed,
} from '@/server/design-studio/http';
import type { DesignStudioEnv } from '@/server/design-studio/types';

/**
 * GET /api/design-studio/checkout-summary?projectId=
 * Server-calculated price + selection summary. Never trusts browser amounts.
 */
export async function handleCheckoutSummary(
  request: Request,
  env: DesignStudioEnv,
): Promise<Response> {
  if (request.method !== 'GET') {
    return methodNotAllowed(['GET']);
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(
      401,
      'missing_access_token',
      'A valid project access token is required.',
    );
  }

  const url = new URL(request.url);
  const projectId = url.searchParams.get('projectId')?.trim();
  if (!projectId) {
    return errorResponse(400, 'missing_project_id', 'projectId is required.');
  }

  try {
    const checkout = await buildCheckoutSummary(env, { projectId, accessToken });
    return jsonResponse({ ok: true, checkout });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'checkout_failed';
    if (message === 'UNAUTHORIZED') {
      return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
    }
    if (message === 'NO_SELECTION' || message === 'CONCEPT_NOT_FOUND') {
      return errorResponse(
        409,
        'no_selection',
        'Choose a website direction before viewing checkout.',
      );
    }
    if (message === 'INVALID_STATE') {
      return errorResponse(
        409,
        'invalid_project_state',
        'Checkout is not available in the current project state.',
      );
    }
    console.error('checkout-summary failed', message);
    return errorResponse(500, 'checkout_failed', 'Unable to build checkout summary.');
  }
}
