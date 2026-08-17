/**
 * Pages Functions–compatible export for GET /api/design-studio/internal/handoff/:id
 */
import { handleInternalHandoff } from '@/server/design-studio/handlers/internalTeam';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

interface PagesContext {
  request: Request;
  env: DesignStudioEnv;
  params: { id?: string };
}

export async function onRequestGet(context: PagesContext): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  const id = context.params.id;
  if (!id) {
    return new Response(
      JSON.stringify({ error: { code: 'missing_id', message: 'Missing project id.' } }),
      { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } },
    );
  }
  return handleInternalHandoff(context.request, context.env, id);
}
