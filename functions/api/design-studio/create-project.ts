/**
 * Pages Functions–compatible export for POST /api/design-studio/create-project.
 * Primary runtime uses workers/app.ts; this mirrors the pack route layout.
 */
import { handleCreateProject } from '@/server/design-studio/handlers/createProject';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleCreateProject(context.request, context.env);
}
