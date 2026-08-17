import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { canSelectConcept } from '../../src/utils/design-studio/selectConcept.ts';

describe('selectConcept rules', () => {
  it('allows selection after generation for ready concepts', () => {
    const result = canSelectConcept({
      projectId: 'p1',
      projectStatus: 'GENERATED',
      conceptProjectId: 'p1',
      conceptStatus: 'READY',
    });
    assert.equal(result.ok, true);
  });

  it('allows re-selection while CONCEPT_SELECTED', () => {
    const result = canSelectConcept({
      projectId: 'p1',
      projectStatus: 'CONCEPT_SELECTED',
      conceptProjectId: 'p1',
      conceptStatus: 'FAILED',
    });
    assert.equal(result.ok, true);
  });

  it('blocks selection before generation completes', () => {
    const result = canSelectConcept({
      projectId: 'p1',
      projectStatus: 'GENERATING',
      conceptProjectId: 'p1',
      conceptStatus: 'READY',
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'invalid_project_state');
  });

  it('blocks concepts that are still pending', () => {
    const result = canSelectConcept({
      projectId: 'p1',
      projectStatus: 'GENERATED',
      conceptProjectId: 'p1',
      conceptStatus: 'PENDING',
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'concept_not_ready');
  });

  it('rejects concepts from another project', () => {
    const result = canSelectConcept({
      projectId: 'p1',
      projectStatus: 'GENERATED',
      conceptProjectId: 'p2',
      conceptStatus: 'READY',
    });
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.code, 'concept_not_found');
  });
});
