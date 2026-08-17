import { buildCheckoutSummary } from '@/server/design-studio/checkoutSummary';
import { saveProjectContact } from '@/server/design-studio/contact';
import {
  errorResponse,
  extractAccessToken,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from '@/server/design-studio/http';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { validateContactInput } from '@/utils/design-studio/validateContact';

type ContactBody = {
  projectId?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  businessName?: string;
  preferredTiming?: string;
  note?: string;
};

/**
 * POST /api/design-studio/contact
 * Save contact details for a project with a selected concept.
 */
export async function handleContact(
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

  const body = await readJsonBody<ContactBody>(request, 40_000);
  if (!body.ok) return body.response;

  const projectId = body.value.projectId?.trim();
  if (!projectId) {
    return errorResponse(400, 'missing_project_id', 'projectId is required.');
  }

  const validated = validateContactInput(body.value);
  if (!validated.ok) {
    return errorResponse(400, 'invalid_contact', validated.errors[0] || 'Invalid contact details.');
  }

  try {
    const project = await saveProjectContact(env, {
      projectId,
      accessToken,
      contact: validated.value,
    });

    const checkout = await buildCheckoutSummary(env, { projectId, accessToken });

    return jsonResponse({
      ok: true,
      project,
      checkout,
      message: checkout.checkoutMode === 'quote'
        ? 'Contact saved. We will send a final quote for this custom scope.'
        : 'Contact saved. Review the checkout summary before payment.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'contact_failed';
    if (message === 'UNAUTHORIZED') {
      return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
    }
    if (message === 'NO_SELECTION') {
      return errorResponse(
        409,
        'no_selection',
        'Choose a website direction before submitting contact details.',
      );
    }
    if (message === 'INVALID_STATE') {
      return errorResponse(
        409,
        'invalid_project_state',
        'Contact details cannot be updated in the current project state.',
      );
    }
    console.error('contact save failed', message);
    return errorResponse(500, 'contact_failed', 'Unable to save contact details.');
  }
}
