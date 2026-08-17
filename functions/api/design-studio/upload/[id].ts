/**
 * Pages Functions–compatible export for DELETE /api/design-studio/upload/:id
 */
import { handleDeleteUpload } from '@/server/design-studio/handlers/deleteUpload';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
  params: { id: string };
}

export async function onRequestDelete(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleDeleteUpload(context.request, context.env, context.params.id);
}
