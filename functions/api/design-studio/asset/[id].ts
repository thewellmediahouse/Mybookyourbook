/**
 * Pages Functions–compatible export for GET /api/design-studio/asset/:id
 */
import { handleAsset } from '@/server/design-studio/handlers/asset';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
  params: { id: string };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleAsset(context.request, context.env, context.params.id);
}
