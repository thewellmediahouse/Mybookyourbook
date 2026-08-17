import {
  getConceptById,
  listConceptsForProject,
  type PublicDesignConcept,
} from '@/server/design-studio/concepts';
import type {
  DesignStudioEnv,
  PublicDesignProject,
} from '@/server/design-studio/types';
import {
  authorizeProjectAccess,
  getProjectById,
  getPublicProject,
} from '@/server/design-studio/projects';
import { assertProjectStatusTransition } from '@/utils/design-studio/projectState';
import {
  canSelectConcept,
  nextStatusAfterSelection,
} from '@/utils/design-studio/selectConcept';
import type { DesignProjectStatus } from '@/types/designStudio';

export type SelectConceptResult = {
  project: PublicDesignProject;
  concepts: PublicDesignConcept[];
  selectedConcept: PublicDesignConcept;
};

/**
 * Persist selected_concept_id and move project to CONCEPT_SELECTED.
 * Re-selection is allowed while still in CONCEPT_SELECTED (before payment).
 */
export async function selectProjectConcept(
  env: DesignStudioEnv,
  input: {
    projectId: string;
    conceptId: string;
    accessToken: string;
  },
): Promise<SelectConceptResult> {
  const authorized = await authorizeProjectAccess(
    env,
    input.projectId,
    input.accessToken,
  );
  if (!authorized) {
    throw new Error('UNAUTHORIZED');
  }

  const concept = await getConceptById(env, input.conceptId);
  if (!concept) {
    throw new Error('CONCEPT_NOT_FOUND');
  }

  const eligibility = canSelectConcept({
    projectId: input.projectId,
    projectStatus: authorized.status,
    conceptProjectId: concept.project_id,
    conceptStatus: concept.status,
  });
  if (!eligibility.ok) {
    throw new Error(`SELECT_DENIED:${eligibility.code}:${eligibility.message}`);
  }

  const nextStatus = nextStatusAfterSelection(authorized.status) as DesignProjectStatus;
  if (authorized.status !== nextStatus) {
    assertProjectStatusTransition(
      authorized.status as DesignProjectStatus,
      nextStatus,
    );
  }

  const updatedAt = new Date().toISOString();
  await env.DESIGN_STUDIO_DB.prepare(
    `UPDATE design_projects
     SET selected_concept_id = ?, status = ?, updated_at = ?
     WHERE id = ?`,
  )
    .bind(input.conceptId, nextStatus, updatedAt, input.projectId)
    .run();

  const projectRow = await getProjectById(env, input.projectId);
  if (!projectRow) {
    throw new Error('PROJECT_NOT_FOUND');
  }

  const concepts = await listConceptsForProject(env, input.projectId);
  const selectedConcept = concepts.find((c) => c.id === input.conceptId);
  if (!selectedConcept) {
    throw new Error('CONCEPT_NOT_FOUND');
  }

  return {
    project: getPublicProject(projectRow),
    concepts,
    selectedConcept,
  };
}
