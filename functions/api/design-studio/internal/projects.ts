/**
 * Pages Functions–compatible export for GET /api/design-studio/internal/projects
 */
import { handleInternalProjects } from '@/server/design-studio/handlers/internalTeam';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleInternalProjects(context.request, context.env);
}
