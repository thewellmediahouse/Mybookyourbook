/**
 * Pages Functions–compatible export for GET /api/design-studio/checkout-summary
 */
import { handleCheckoutSummary } from '@/server/design-studio/handlers/checkoutSummary';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleCheckoutSummary(context.request, context.env);
}
