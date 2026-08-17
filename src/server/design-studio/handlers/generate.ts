import { buildConceptDirections } from '@/ai/design-studio/buildConceptDirections';
import { OpenAITextError } from '@/ai/design-studio/openaiText';
import { DESIGN_STUDIO_PROMPT_VERSION } from '@/ai/design-studio/promptVersion';
import {
  countConceptsForProject,
  listConceptsForProject,
  replaceProjectConcepts,
} from '@/server/design-studio/concepts';
import {
  errorResponse,
  extractAccessToken,
  jsonResponse,
  methodNotAllowed,
  readJsonBody,
} from '@/server/design-studio/http';
import {
  authorizeProjectAccess,
  getPublicProject,
  updateProjectBrief,
} from '@/server/design-studio/projects';
import { publicOpenAiErrorMessage } from '@/server/design-studio/publicErrors';
import {
  fetchLogoBytes,
  scanExistingWebsite,
} from '@/server/design-studio/scanWebsite';
import { verifyTurnstileToken } from '@/server/design-studio/turnstile';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { createServerUploadFromBytes } from '@/server/design-studio/uploads';
import type { DesignBrief, WebsiteScanBrief } from '@/types/designStudio';
import { validateBriefForGeneration } from '@/utils/design-studio/validateConceptResponse';

/** Failed OpenAI/timeouts still consume an attempt — keep headroom for retries. */
const MAX_GENERATION_ATTEMPTS = 5;

type GenerateBody = {
  projectId?: string;
  turnstileToken?: string;
  brief?: Partial<DesignBrief>;
};

async function markProjectFailed(env: DesignStudioEnv, projectId: string): Promise<void> {
  try {
    await updateProjectBrief(env, projectId, {}, { status: 'FAILED' });
  } catch {
    // Best-effort — original error is more important for the client.
  }
}

export type DesignStudioExecutionContext = {
  waitUntil: (promise: Promise<unknown>) => void;
};

/**
 * POST /api/design-studio/generate
 * Turnstile gate + OpenAI structured directions only.
 * Visual mockups are generated from the results page (one image per request)
 * so Free-plan Workers are not killed mid-batch in waitUntil.
 */
export async function handleGenerate(
  request: Request,
  env: DesignStudioEnv,
  _ctx?: DesignStudioExecutionContext,
): Promise<Response> {
  if (request.method !== 'POST') {
    return methodNotAllowed(['POST']);
  }

  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return errorResponse(
      401,
      'missing_access_token',
      'A valid project access token is required.',
    );
  }

  const body = await readJsonBody<GenerateBody>(request, 120_000);
  if (!body.ok) return body.response;

  const projectId = body.value.projectId?.trim();
  if (!projectId) {
    return errorResponse(400, 'missing_project_id', 'projectId is required.');
  }

  const turnstile = await verifyTurnstileToken({
    secret: env.TURNSTILE_SECRET_KEY || '',
    token: body.value.turnstileToken || '',
    remoteIp: request.headers.get('cf-connecting-ip'),
  });

  if (!turnstile.ok) {
    const status = turnstile.code === 'turnstile_not_configured' ? 503 : 400;
    return errorResponse(status, turnstile.code, turnstile.message);
  }

  const authorized = await authorizeProjectAccess(env, projectId, accessToken);
  if (!authorized) {
    return errorResponse(404, 'project_not_found', 'Project not found or access denied.');
  }

  if (authorized.status === 'GENERATING') {
    return errorResponse(
      409,
      'generation_in_progress',
      'Generation is already in progress for this project.',
    );
  }

  const existingCount = await countConceptsForProject(env, projectId);
  const generationAttempts = Number(authorized.generation_attempts ?? 0);

  if (authorized.status === 'GENERATED') {
    return errorResponse(
      409,
      'generation_limit',
      'This project already has a concept generation batch.',
    );
  }
  if (existingCount >= 4 && authorized.status !== 'FAILED') {
    return errorResponse(
      409,
      'generation_limit',
      'This project already has a concept generation batch.',
    );
  }
  if (generationAttempts >= MAX_GENERATION_ATTEMPTS) {
    return errorResponse(
      409,
      'generation_limit',
      'This project has reached the maximum number of generation attempts.',
    );
  }

  if (
    authorized.status !== 'DRAFT' &&
    authorized.status !== 'READY_TO_GENERATE' &&
    authorized.status !== 'FAILED'
  ) {
    return errorResponse(
      409,
      'invalid_project_state',
      'This project cannot start generation in its current state.',
    );
  }

  if (!env.OPENAI_API_KEY) {
    return errorResponse(503, 'openai_not_configured', 'AI generation is not configured yet.');
  }

  const textModel = (env.OPENAI_TEXT_MODEL || '').trim() || 'gpt-4.1-mini';

  try {
    let project = await updateProjectBrief(env, projectId, body.value.brief ?? {}, {
      promptVersion: DESIGN_STUDIO_PROMPT_VERSION,
      ...(authorized.status === 'DRAFT' || authorized.status === 'FAILED'
        ? { status: 'READY_TO_GENERATE' }
        : {}),
    });

    const briefCheck = validateBriefForGeneration(
      (project.brief || {}) as Partial<DesignBrief>,
    );
    if (!briefCheck.ok || !briefCheck.value) {
      return errorResponse(
        400,
        'incomplete_brief',
        briefCheck.errors[0] || 'Please complete the wizard brief before generating.',
      );
    }

    // Scan the visitor's current website (if provided) before locking generation.
    let websiteScan: WebsiteScanBrief | null = null;
    const existingUrl = briefCheck.value.existingWebsiteUrl?.trim();
    if (existingUrl) {
      try {
        const scan = await scanExistingWebsite(existingUrl);
        if (scan.ok) {
          let logoImported = false;
          const hasLogoAlready = await env.DESIGN_STUDIO_DB.prepare(
            `SELECT 1 AS ok FROM design_uploads
             WHERE project_id = ? AND kind = 'logo' AND deleted_at IS NULL
             LIMIT 1`,
          )
            .bind(projectId)
            .first<{ ok: number }>();

          if (!hasLogoAlready && scan.logoCandidateUrls?.length) {
            for (const logoUrl of scan.logoCandidateUrls.slice(0, 3)) {
              const logo = await fetchLogoBytes(logoUrl);
              if (!logo) continue;
              const uploaded = await createServerUploadFromBytes(env, {
                projectId,
                bytes: logo.bytes,
                mimeType: logo.mimeType,
                filename: logo.filename,
                kind: 'logo',
              });
              if (uploaded) {
                logoImported = true;
                break;
              }
            }
          }

          websiteScan = {
            url: scan.url,
            title: scan.title,
            description: scan.description,
            headings: scan.headings,
            textSample: scan.textSample,
            themeColor: scan.themeColor,
            logoImported,
          };
        }
      } catch (scanError) {
        console.error(
          'website scan failed',
          projectId,
          scanError instanceof Error ? scanError.message : scanError,
        );
      }
    }

    project = await updateProjectBrief(env, projectId, {}, { status: 'GENERATING' });

    const startedAt = new Date().toISOString();
    await env.DESIGN_STUDIO_DB.prepare(
      `UPDATE design_projects
       SET generation_started_at = ?,
           generation_attempts = COALESCE(generation_attempts, 0) + 1,
           updated_at = ?
       WHERE id = ?`,
    )
      .bind(startedAt, startedAt, projectId)
      .run();

    const { batch, model, repaired } = await buildConceptDirections({
      apiKey: env.OPENAI_API_KEY,
      model: textModel,
      brief: briefCheck.value,
      websiteScan,
    });

    await replaceProjectConcepts(env, {
      projectId,
      batch,
      modelName: model,
    });

    // Directions ready — results page drives visual mockups one slot at a time.
    await updateProjectBrief(env, projectId, {}, { status: 'GENERATED' });

    const completedAt = new Date().toISOString();
    await env.DESIGN_STUDIO_DB.prepare(
      `UPDATE design_projects
       SET generation_completed_at = ?, updated_at = ?
       WHERE id = ?`,
    )
      .bind(completedAt, completedAt, projectId)
      .run();

    const concepts = await listConceptsForProject(env, projectId);
    const refreshed = await authorizeProjectAccess(env, projectId, accessToken);

    return jsonResponse({
      ok: true,
      status: refreshed?.status ?? 'GENERATED',
      project: refreshed ? getPublicProject(refreshed) : project,
      concepts,
      generation: {
        stage: 'images_pending',
        aiPending: false,
        imagesPending: true,
        repaired,
        model,
        message:
          'Four website directions are ready. Visual mockups will load on the results page.',
      },
    });
  } catch (error) {
    await markProjectFailed(env, projectId);

    if (error instanceof OpenAITextError) {
      return errorResponse(error.status, error.code, publicOpenAiErrorMessage(error));
    }

    const message = error instanceof Error ? error.message : 'generate_failed';
    if (message.startsWith('Invalid project status transition')) {
      return errorResponse(
        409,
        'invalid_transition',
        'That project status change is not allowed.',
      );
    }
    console.error('generate failed', message);
    return errorResponse(
      500,
      'generate_failed',
      'Unable to generate website directions. Please try again.',
    );
  }
}
