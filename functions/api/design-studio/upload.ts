/**
 * Pages Functions–compatible export for POST /api/design-studio/upload
 */
import { handleUpload } from '@/server/design-studio/handlers/upload';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
}

export async function onRequestPost(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  return handleUpload(context.request, context.env);
}
