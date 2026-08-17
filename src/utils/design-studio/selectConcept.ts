/**
 * Pure selection rules for Design Studio concepts (unit-testable).
 */

const SELECTABLE_PROJECT_STATUSES = new Set(['GENERATED', 'CONCEPT_SELECTED']);

/** Concepts still being generated cannot be chosen. */
const BLOCKED_CONCEPT_STATUSES = new Set(['PENDING', 'GENERATING']);

export function canSelectConcept(input: {
  projectId: string;
  projectStatus: string;
  conceptProjectId: string;
  conceptStatus: string;
}): { ok: true } | { ok: false; code: string; message: string } {
  if (!SELECTABLE_PROJECT_STATUSES.has(input.projectStatus)) {
    return {
      ok: false,
      code: 'invalid_project_state',
      message: 'A concept can only be selected after generation completes.',
    };
  }

  if (input.conceptProjectId !== input.projectId) {
    return {
      ok: false,
      code: 'concept_not_found',
      message: 'Concept not found for this project.',
    };
  }

  if (BLOCKED_CONCEPT_STATUSES.has(input.conceptStatus)) {
    return {
      ok: false,
      code: 'concept_not_ready',
      message: 'This concept is still generating. Please wait or retry failed visuals first.',
    };
  }

  return { ok: true };
}

export function nextStatusAfterSelection(_projectStatus?: string): 'CONCEPT_SELECTED' {
  return 'CONCEPT_SELECTED';
}
