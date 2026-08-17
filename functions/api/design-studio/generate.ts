/**
 * Pages Functions–compatible export for POST /api/design-studio/generate
 */
import { handleGenerate } from '@/server/design-studio/handlers/generate';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleGenerate(context.request, context.env);
}
