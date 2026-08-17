import { buildVisualPrompt } from '@/ai/design-studio/buildVisualPrompt';
import {
  CONCEPT_IMAGE_QUALITY,
  CONCEPT_IMAGE_SIZE,
  createConceptImage,
  OpenAIImageError,
} from '@/ai/design-studio/openaiImage';
import {
  getConceptById,
  listConceptRowsForProject,
  markConceptGenerating,
  markConceptImageFailed,
  markConceptImageReady,
  type DesignConceptRow,
} from '@/server/design-studio/concepts';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import type { ConceptDirection, DesignBrief } from '@/types/designStudio';
import {
  buildConceptObjectKey,
  canRetryFailedConcept,
  mapWithConcurrency,
  nextImageFailureCode,
} from '@/utils/design-studio/conceptAssets';

const IMAGE_CONCURRENCY = 2;
const MAX_REFERENCE_IMAGES = 3;

export type ConceptImageBatchSummary = {
  attempted: number;
  succeeded: number;
  failed: number;
  skipped: number;
  usedReferenceImages: boolean;
  model: string;
};

function parseDirection(row: DesignConceptRow): ConceptDirection {
  try {
    return JSON.parse(row.direction_json || '{}') as ConceptDirection;
  } catch {
    return {} as ConceptDirection;
  }
}

type ReferenceFlags = {
  hasLogo: boolean;
  hasReferences: boolean;
};

/** Metadata only — avoids slow R2 downloads when generating text-only previews. */
async function loadReferenceFlags(
  env: DesignStudioEnv,
  projectId: string,
): Promise<ReferenceFlags> {
  const uploads = await env.DESIGN_STUDIO_DB.prepare(
    `SELECT kind
     FROM design_uploads
     WHERE project_id = ?
       AND deleted_at IS NULL
       AND mime_type LIKE 'image/%'
     LIMIT ?`,
  )
    .bind(projectId, MAX_REFERENCE_IMAGES)
    .all<{ kind: string }>();

  let hasLogo = false;
  let hasReferences = false;
  for (const upload of uploads.results ?? []) {
    if (upload.kind === 'logo') hasLogo = true;
    else hasReferences = true;
  }
  return { hasLogo, hasReferences };
}

async function persistConceptImage(
  env: DesignStudioEnv,
  row: DesignConceptRow,
  image: { bytes: Uint8Array; mimeType: string; model: string },
  visualPrompt: string,
): Promise<void> {
  if (!env.DESIGN_STUDIO_ASSETS) {
    throw new Error('R2_UNAVAILABLE');
  }

  const objectKey = buildConceptObjectKey(row.project_id, row.slot, image.mimeType);

  // Replace any prior object under a different extension.
  if (row.r2_object_key && row.r2_object_key !== objectKey) {
    try {
      await env.DESIGN_STUDIO_ASSETS.delete(row.r2_object_key);
    } catch {
      // Best-effort cleanup.
    }
  }

  await env.DESIGN_STUDIO_ASSETS.put(objectKey, image.bytes, {
    httpMetadata: { contentType: image.mimeType },
    customMetadata: {
      projectId: row.project_id,
      conceptId: row.id,
      slot: String(row.slot),
    },
  });

  await markConceptImageReady(env, {
    conceptId: row.id,
    objectKey,
    mimeType: image.mimeType,
    modelName: image.model,
    visualPrompt,
  });
}

async function generateOneConceptImage(input: {
  env: DesignStudioEnv;
  row: DesignConceptRow;
  brief: DesignBrief;
  apiKey: string;
  model: string;
  references: ReferenceFlags;
}): Promise<'succeeded' | 'failed' | 'skipped'> {
  const { env, row, brief, apiKey, model, references } = input;

  if (row.status === 'READY' && row.r2_object_key) {
    return 'skipped';
  }

  if (row.status === 'FAILED' && !canRetryFailedConcept(row.error_code)) {
    return 'skipped';
  }

  await markConceptGenerating(env, row.id);

  const direction = parseDirection(row);
  const prompt = buildVisualPrompt({
    brief,
    direction,
    hasLogoUpload: references.hasLogo,
    hasReferenceUploads: references.hasReferences,
  });

  try {
    const image = await createConceptImage({
      apiKey,
      model,
      prompt,
      // Text-only is much faster than the edits endpoint for card previews.
      preferTextOnly: true,
      size: CONCEPT_IMAGE_SIZE,
      quality: CONCEPT_IMAGE_QUALITY,
    });

    await persistConceptImage(env, row, image, prompt);
    return 'succeeded';
  } catch (error) {
    const code =
      error instanceof OpenAIImageError
        ? error.code
        : error instanceof Error && error.message === 'R2_UNAVAILABLE'
          ? 'r2_unavailable'
          : 'image_failed';

    const failureCode =
      code === 'r2_unavailable' || code === 'openai_not_configured'
        ? code
        : nextImageFailureCode(row.error_code);

    await markConceptImageFailed(env, row.id, failureCode);
    console.error('concept image failed', row.id, failureCode, error);
    return 'failed';
  }
}

/**
 * Generate visual mockups for PENDING/FAILED concept slots.
 * Successful images are kept; failed slots remain retryable once.
 */
export async function generateConceptImagesForProject(
  env: DesignStudioEnv,
  input: {
    projectId: string;
    brief: DesignBrief;
    /** When set, only these concept ids are attempted (retry path). */
    conceptIds?: string[];
    concurrency?: number;
  },
): Promise<ConceptImageBatchSummary> {
  const model = (env.OPENAI_IMAGE_MODEL || '').trim() || 'gpt-image-1-mini';
  const apiKey = (env.OPENAI_API_KEY || '').trim();

  if (!apiKey) {
    throw new OpenAIImageError('OpenAI is not configured.', 503, 'openai_not_configured');
  }

  if (!env.DESIGN_STUDIO_ASSETS) {
    const rows = await listConceptRowsForProject(env, input.projectId);
    for (const row of rows) {
      if (row.status === 'READY' && row.r2_object_key) continue;
      await markConceptImageFailed(env, row.id, 'r2_unavailable');
    }
    return {
      attempted: rows.length,
      succeeded: 0,
      failed: rows.length,
      skipped: 0,
      usedReferenceImages: false,
      model,
    };
  }

  let rows = await listConceptRowsForProject(env, input.projectId);
  if (input.conceptIds?.length) {
    const allowed = new Set(input.conceptIds);
    rows = rows.filter((row) => allowed.has(row.id));
  } else {
    rows = rows.filter(
      (row) =>
        !(row.status === 'READY' && row.r2_object_key) &&
        (row.status === 'PENDING' ||
          row.status === 'FAILED' ||
          row.status === 'GENERATING'),
    );
  }

  const references = await loadReferenceFlags(env, input.projectId);
  const concurrency = input.concurrency ?? IMAGE_CONCURRENCY;

  const outcomes = await mapWithConcurrency(rows, concurrency, async (row) => {
    // Re-read in case a concurrent path updated the row.
    const fresh = (await getConceptById(env, row.id)) || row;
    return generateOneConceptImage({
      env,
      row: fresh,
      brief: input.brief,
      apiKey,
      model,
      references,
    });
  });

  return {
    attempted: outcomes.filter((o) => o !== 'skipped').length,
    succeeded: outcomes.filter((o) => o === 'succeeded').length,
    failed: outcomes.filter((o) => o === 'failed').length,
    skipped: outcomes.filter((o) => o === 'skipped').length,
    usedReferenceImages: false,
    model,
  };
}
