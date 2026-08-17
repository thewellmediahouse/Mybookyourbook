import { handleAsset } from '@/server/design-studio/handlers/asset';
import { handleCheckoutSummary } from '@/server/design-studio/handlers/checkoutSummary';
import { handleConceptImage } from '@/server/design-studio/handlers/conceptImage';
import { handleContact } from '@/server/design-studio/handlers/contact';
import { handleCreatePayment } from '@/server/design-studio/handlers/createPayment';
import { handleCreateProject } from '@/server/design-studio/handlers/createProject';
import { handleDeleteUpload } from '@/server/design-studio/handlers/deleteUpload';
import {
  handleGenerate,
  type DesignStudioExecutionContext,
} from '@/server/design-studio/handlers/generate';
import {
  handleInternalHandoff,
  handleInternalProjects,
} from '@/server/design-studio/handlers/internalTeam';
import { handlePayfastNotify } from '@/server/design-studio/handlers/payfastNotify';
import { handleProjectById } from '@/server/design-studio/handlers/projectById';
import { handleRetryImages } from '@/server/design-studio/handlers/retryImages';
import { handleSelectConcept } from '@/server/design-studio/handlers/selectConcept';
import { handleUpload } from '@/server/design-studio/handlers/upload';
import { errorResponse } from '@/server/design-studio/http';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { designStudioApiDisabledResponse } from '@/utils/design-studio/featureGate';

/**
 * Route Design Studio API requests.
 * Mounted under /api/design-studio/*
 */
export async function routeDesignStudioApi(
  request: Request,
  env: DesignStudioEnv,
  pathname: string,
  ctx?: DesignStudioExecutionContext,
): Promise<Response> {
  const disabled = designStudioApiDisabledResponse();
  if (disabled) return disabled;

  const path = pathname.replace(/\/+$/, '') || '/';

  if (path === '/api/design-studio/create-project') {
    return handleCreateProject(request, env);
  }

  if (path === '/api/design-studio/upload') {
    return handleUpload(request, env);
  }

  if (path === '/api/design-studio/generate') {
    return handleGenerate(request, env, ctx);
  }

  if (path === '/api/design-studio/retry-images') {
    return handleRetryImages(request, env);
  }

  if (path === '/api/design-studio/select-concept') {
    return handleSelectConcept(request, env);
  }

  if (path === '/api/design-studio/contact') {
    return handleContact(request, env);
  }

  if (path === '/api/design-studio/checkout-summary') {
    return handleCheckoutSummary(request, env);
  }

  if (path === '/api/design-studio/create-payment') {
    return handleCreatePayment(request, env);
  }

  if (path === '/api/design-studio/payfast-notify') {
    return handlePayfastNotify(request, env);
  }

  if (path === '/api/design-studio/internal/projects') {
    return handleInternalProjects(request, env);
  }

  const internalHandoffMatch = path.match(
    /^\/api\/design-studio\/internal\/handoff\/([^/]+)$/,
  );
  if (internalHandoffMatch?.[1]) {
    return handleInternalHandoff(
      request,
      env,
      decodeURIComponent(internalHandoffMatch[1]),
    );
  }

  const uploadMatch = path.match(/^\/api\/design-studio\/upload\/([^/]+)$/);
  if (uploadMatch?.[1]) {
    return handleDeleteUpload(request, env, decodeURIComponent(uploadMatch[1]));
  }

  const assetMatch = path.match(/^\/api\/design-studio\/asset\/([^/]+)$/);
  if (assetMatch?.[1]) {
    return handleAsset(request, env, decodeURIComponent(assetMatch[1]));
  }

  const conceptImageMatch = path.match(/^\/api\/design-studio\/concept-image\/([^/]+)$/);
  if (conceptImageMatch?.[1]) {
    return handleConceptImage(request, env, decodeURIComponent(conceptImageMatch[1]));
  }

  const projectMatch = path.match(/^\/api\/design-studio\/project\/([^/]+)$/);
  if (projectMatch?.[1]) {
    return handleProjectById(request, env, decodeURIComponent(projectMatch[1]));
  }

  return errorResponse(404, 'not_found', 'Design Studio API route not found.');
}
