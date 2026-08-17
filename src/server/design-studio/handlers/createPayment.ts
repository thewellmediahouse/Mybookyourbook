import { buildCheckoutSummary } from '@/server/design-studio/checkoutSummary';
import {
  errorResponse,
  extractAccessToken,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from '@/server/design-studio/http';
import { createOrReuseOrder, toPublicOrder } from '@/server/design-studio/orders';
import {
  authorizeProjectAccess,
  updateProjectBrief,
} from '@/server/design-studio/projects';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import {
  formatPayfastAmount,
  generatePayfastCheckoutSignature,
  payfastProcessUrl,
  resolvePayfastMode,
  splitContactName,
} from '@/utils/design-studio/payfast';

type CreatePaymentBody = {
  projectId?: string;
};

function requirePayfastConfig(env: DesignStudioEnv): {
  mode: 'sandbox' | 'live';
  merchantId: string;
  merchantKey: string;
  passphrase: string;
  siteUrl: string;
} | Response {
  const mode = resolvePayfastMode(env.PAYFAST_MODE);
  const merchantId = (env.PAYFAST_MERCHANT_ID || '').trim();
  const merchantKey = (env.PAYFAST_MERCHANT_KEY || '').trim();
  const passphrase = (env.PAYFAST_PASSPHRASE || '').trim();
  const siteUrl = (env.PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');

  if (!merchantId || !merchantKey) {
    return errorResponse(
      503,
      'payfast_not_configured',
      'PayFast credentials are not configured.',
    );
  }
  if (!siteUrl) {
    return errorResponse(
      503,
      'site_url_missing',
      'PUBLIC_SITE_URL is required to build PayFast return/notify URLs.',
    );
  }

  return { mode, merchantId, merchantKey, passphrase, siteUrl };
}

/**
 * POST /api/design-studio/create-payment
 * Creates/reuses an order and returns a signed PayFast checkout form payload.
 */
export async function handleCreatePayment(
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

  const body = await readJsonBody<CreatePaymentBody>(request, 20_000);
  if (!body.ok) return body.response;

  const projectId = body.value.projectId?.trim();
  if (!projectId) {
    return errorResponse(400, 'missing_project_id', 'projectId is required.');
  }

  const config = requirePayfastConfig(env);
  if (config instanceof Response) return config;

  const authorized = await authorizeProjectAccess(env, projectId, accessToken);
  if (!authorized) {
    return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
  }

  if (
    authorized.status !== 'CONCEPT_SELECTED' &&
    authorized.status !== 'AWAITING_PAYMENT'
  ) {
    return errorResponse(
      409,
      'invalid_project_state',
      'Payment can only start after a concept is selected.',
    );
  }

  if (!authorized.contact_email || !authorized.contact_name) {
    return errorResponse(
      409,
      'contact_required',
      'Save your contact details before starting payment.',
    );
  }

  try {
    const checkout = await buildCheckoutSummary(env, { projectId, accessToken });
    if (checkout.checkoutMode === 'quote' || checkout.price.requiresQuote) {
      return errorResponse(
        409,
        'quote_required',
        'This project requires a final quote and cannot use fixed PayFast checkout.',
      );
    }

    if (checkout.price.payableZar == null || checkout.price.payableZar <= 0) {
      return errorResponse(409, 'invalid_amount', 'Payable amount could not be calculated.');
    }

    const order = await createOrReuseOrder(env, {
      projectId,
      publicReference: checkout.publicReference,
      price: checkout.price,
      payableZar: checkout.price.payableZar,
    });

    if (authorized.status === 'CONCEPT_SELECTED') {
      await updateProjectBrief(env, projectId, {}, { status: 'AWAITING_PAYMENT' });
    }

    const { first, last } = splitContactName(authorized.contact_name || 'Customer');
    const amount = formatPayfastAmount(checkout.price.payableZar);

    const fields: Record<string, string> = {
      merchant_id: config.merchantId,
      merchant_key: config.merchantKey,
      return_url: `${config.siteUrl}/design-your-website/payment/success`,
      cancel_url: `${config.siteUrl}/design-your-website/payment/cancel`,
      notify_url: `${config.siteUrl}/api/design-studio/payfast-notify`,
      name_first: first.slice(0, 100),
      name_last: last.slice(0, 100),
      email_address: (authorized.contact_email || '').slice(0, 100),
      cell_number: (authorized.contact_phone || '').replace(/\s+/g, '').slice(0, 100),
      m_payment_id: order.merchant_payment_id,
      amount,
      item_name: `Website direction — ${checkout.publicReference}`.slice(0, 100),
      item_description: checkout.selectedConceptName.slice(0, 255),
      custom_str1: projectId.slice(0, 255),
      custom_str2: checkout.selectedConceptId.slice(0, 255),
    };

    // Drop blank optional fields before signing.
    for (const [key, value] of Object.entries(fields)) {
      if (!value.trim()) delete fields[key];
    }

    const signature = generatePayfastCheckoutSignature(fields, config.passphrase || null);
    fields.signature = signature;

    // Never send merchant_key to client logs; it is required in the form post to PayFast.
    return jsonResponse({
      ok: true,
      mode: config.mode,
      processUrl: payfastProcessUrl(config.mode),
      order: toPublicOrder(order),
      checkout,
      fields,
      message: 'PayFast checkout is ready. You will be redirected to complete payment.',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'create_payment_failed';
    if (message.startsWith('Invalid project status transition')) {
      return errorResponse(409, 'invalid_transition', message);
    }
    console.error('create-payment failed', message);
    return errorResponse(500, 'create_payment_failed', 'Unable to start PayFast checkout.');
  }
}
