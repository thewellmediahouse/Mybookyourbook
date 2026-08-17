/**
 * Pages Functions–compatible export for POST /api/design-studio/select-concept
 */
import { handleSelectConcept } from '@/server/design-studio/handlers/selectConcept';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleSelectConcept(context.request, context.env);
}
