/**
 * Pages Functions–compatible export for /api/design-studio/project/:id
 */
import { handleProjectById } from '@/server/design-studio/handlers/projectById';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
  params: { id: string };
}

export async function onRequest(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleProjectById(context.request, context.env, context.params.id);
}
