import type { ConceptBatch, ConceptDirection } from '@/types/designStudio';
import {
  buildConceptObjectKey,
  canRetryFailedConcept,
} from '@/utils/design-studio/conceptAssets';
import type { DesignStudioEnv } from '@/server/design-studio/types';
import { authorizeProjectAccess, getProjectById } from '@/server/design-studio/projects';

export type DesignConceptRow = {
  id: string;
  project_id: string;
  slot: number;
  status: string;
  direction_json: string;
  visual_prompt: string | null;
  r2_object_key: string | null;
  mime_type: string | null;
  generation_provider: string | null;
  model_name: string | null;
  error_code: string | null;
  created_at: string;
  updated_at: string;
};

export type PublicDesignConcept = {
  id: string;
  slot: number;
  status: string;
  direction: ConceptDirection;
  visualPrompt: string | null;
  hasImage: boolean;
  imagePath: string | null;
  modelName: string | null;
  errorCode: string | null;
  canRetry: boolean;
};

function toPublicConcept(row: DesignConceptRow): PublicDesignConcept {
  let direction = {} as ConceptDirection;
  try {
    direction = JSON.parse(row.direction_json || '{}') as ConceptDirection;
  } catch {
    direction = {} as ConceptDirection;
  }

  const hasImage = Boolean(row.r2_object_key);
  const failed = row.status === 'FAILED';

  return {
    id: row.id,
    slot: row.slot,
    status: row.status,
    direction,
    visualPrompt: row.visual_prompt,
    hasImage,
    imagePath: hasImage ? `/api/design-studio/concept-image/${row.id}` : null,
    modelName: row.model_name,
    errorCode: row.error_code,
    canRetry: failed && canRetryFailedConcept(row.error_code),
  };
}

export async function listConceptsForProject(
  env: DesignStudioEnv,
  projectId: string,
): Promise<PublicDesignConcept[]> {
  const result = await env.DESIGN_STUDIO_DB.prepare(
    `SELECT * FROM design_concepts
     WHERE project_id = ?
     ORDER BY slot ASC`,
  )
    .bind(projectId)
    .all<DesignConceptRow>();

  return (result.results ?? []).map(toPublicConcept);
}

export async function getConceptById(
  env: DesignStudioEnv,
  conceptId: string,
): Promise<DesignConceptRow | null> {
  return (
    (await env.DESIGN_STUDIO_DB.prepare(
      `SELECT * FROM design_concepts WHERE id = ? LIMIT 1`,
    )
      .bind(conceptId)
      .first<DesignConceptRow>()) ?? null
  );
}

export async function listConceptRowsForProject(
  env: DesignStudioEnv,
  projectId: string,
): Promise<DesignConceptRow[]> {
  const result = await env.DESIGN_STUDIO_DB.prepare(
    `SELECT * FROM design_concepts
     WHERE project_id = ?
     ORDER BY slot ASC`,
  )
    .bind(projectId)
    .all<DesignConceptRow>();
  return result.results ?? [];
}

export async function replaceProjectConcepts(
  env: DesignStudioEnv,
  input: {
    projectId: string;
    batch: ConceptBatch;
    modelName: string;
  },
): Promise<PublicDesignConcept[]> {
  const now = new Date().toISOString();

  // One generation batch per project for V1 — clear any prior rows.
  await env.DESIGN_STUDIO_DB.prepare(`DELETE FROM design_concepts WHERE project_id = ?`)
    .bind(input.projectId)
    .run();

  for (let index = 0; index < input.batch.concepts.length; index += 1) {
    const concept = input.batch.concepts[index]!;
    const slot = index + 1;
    const id = crypto.randomUUID();

    await env.DESIGN_STUDIO_DB.prepare(
      `INSERT INTO design_concepts (
        id, project_id, slot, status, direction_json, visual_prompt,
        generation_provider, model_name, created_at, updated_at
      ) VALUES (?, ?, ?, 'PENDING', ?, ?, 'openai', ?, ?, ?)`,
    )
      .bind(
        id,
        input.projectId,
        slot,
        JSON.stringify({ ...concept, id: concept.id || `concept-0${slot}` }),
        concept.visualPrompt,
        input.modelName,
        now,
        now,
      )
      .run();
  }

  return listConceptsForProject(env, input.projectId);
}

export async function countConceptsForProject(
  env: DesignStudioEnv,
  projectId: string,
): Promise<number> {
  const row = await env.DESIGN_STUDIO_DB.prepare(
    `SELECT COUNT(*) AS count FROM design_concepts WHERE project_id = ?`,
  )
    .bind(projectId)
    .first<{ count: number }>();
  return Number(row?.count ?? 0);
}

export async function markConceptGenerating(
  env: DesignStudioEnv,
  conceptId: string,
): Promise<void> {
  const now = new Date().toISOString();
  await env.DESIGN_STUDIO_DB.prepare(
    `UPDATE design_concepts
     SET status = 'GENERATING', error_code = NULL, updated_at = ?
     WHERE id = ?`,
  )
    .bind(now, conceptId)
    .run();
}

export async function markConceptImageReady(
  env: DesignStudioEnv,
  input: {
    conceptId: string;
    objectKey: string;
    mimeType: string;
    modelName: string;
    visualPrompt: string;
  },
): Promise<void> {
  const now = new Date().toISOString();
  await env.DESIGN_STUDIO_DB.prepare(
    `UPDATE design_concepts
     SET status = 'READY',
         r2_object_key = ?,
         mime_type = ?,
         model_name = ?,
         visual_prompt = ?,
         generation_provider = 'openai',
         error_code = NULL,
         updated_at = ?
     WHERE id = ?`,
  )
    .bind(
      input.objectKey,
      input.mimeType,
      input.modelName,
      input.visualPrompt,
      now,
      input.conceptId,
    )
    .run();
}

export async function markConceptImageFailed(
  env: DesignStudioEnv,
  conceptId: string,
  errorCode: string,
): Promise<void> {
  const now = new Date().toISOString();
  await env.DESIGN_STUDIO_DB.prepare(
    `UPDATE design_concepts
     SET status = 'FAILED', error_code = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(errorCode, now, conceptId)
    .run();
}

export async function readAuthorizedConceptObject(
  env: DesignStudioEnv,
  input: {
    conceptId: string;
    accessToken: string;
  },
): Promise<{ row: DesignConceptRow; object: R2ObjectBody }> {
  if (!env.DESIGN_STUDIO_ASSETS) {
    throw new Error('R2_UNAVAILABLE');
  }

  const row = await getConceptById(env, input.conceptId);
  if (!row?.r2_object_key) {
    throw new Error('NOT_FOUND');
  }

  const project = await authorizeProjectAccess(env, row.project_id, input.accessToken);
  if (!project) {
    throw new Error('UNAUTHORIZED');
  }

  const stillThere = await getProjectById(env, row.project_id);
  if (!stillThere) {
    throw new Error('NOT_FOUND');
  }

  const object = await env.DESIGN_STUDIO_ASSETS.get(row.r2_object_key);
  if (!object) {
    throw new Error('NOT_FOUND');
  }

  return { row, object };
}

export { buildConceptObjectKey, toPublicConcept };
