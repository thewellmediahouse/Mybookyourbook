import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  generateAccessToken,
  hashAccessToken,
  timingSafeEqual,
  verifyAccessToken,
  createProjectId,
  createPublicReference,
} from '../../src/utils/design-studio/accessToken.ts';
import {
  canTransitionProjectStatus,
  assertProjectStatusTransition,
} from '../../src/utils/design-studio/projectState.ts';

describe('accessToken', () => {
  it('generates a URL-safe opaque token', async () => {
    const token = await generateAccessToken();
    assert.match(token, /^[A-Za-z0-9_-]+$/);
    assert.ok(token.length >= 40);
  });

  it('hashes and verifies tokens; rejects wrong token', async () => {
    const token = await generateAccessToken();
    const hash = await hashAccessToken(token);
    assert.equal(await verifyAccessToken(token, hash), true);
    assert.equal(await verifyAccessToken('not-the-token', hash), false);
    assert.equal(await verifyAccessToken('', hash), false);
  });

  it('does not store raw token equivalence in hash', async () => {
    const token = await generateAccessToken();
    const hash = await hashAccessToken(token);
    assert.notEqual(token, hash);
  });

  it('timingSafeEqual distinguishes unequal strings', () => {
    assert.equal(timingSafeEqual('abcd', 'abcd'), true);
    assert.equal(timingSafeEqual('abcd', 'abce'), false);
    assert.equal(timingSafeEqual('abc', 'abcd'), false);
  });

  it('creates uuid project ids and WM public references', () => {
    assert.match(createProjectId(), /^[0-9a-f-]{36}$/i);
    assert.match(createPublicReference(), /^WM-[A-Z0-9]{6}$/);
  });
});

describe('projectState transitions', () => {
  it('allows the happy path transitions', () => {
    assert.equal(canTransitionProjectStatus('DRAFT', 'READY_TO_GENERATE'), true);
    assert.equal(canTransitionProjectStatus('READY_TO_GENERATE', 'GENERATING'), true);
    assert.equal(canTransitionProjectStatus('GENERATING', 'GENERATED'), true);
    assert.equal(canTransitionProjectStatus('GENERATED', 'CONCEPT_SELECTED'), true);
    assert.equal(canTransitionProjectStatus('CONCEPT_SELECTED', 'AWAITING_PAYMENT'), true);
    assert.equal(canTransitionProjectStatus('AWAITING_PAYMENT', 'PAID'), true);
    assert.equal(canTransitionProjectStatus('PAID', 'READY_FOR_DESIGNER'), true);
  });

  it('blocks illegal transitions', () => {
    assert.equal(canTransitionProjectStatus('DRAFT', 'PAID'), false);
    assert.equal(canTransitionProjectStatus('COMPLETED', 'DRAFT'), false);
    assert.throws(() => assertProjectStatusTransition('DRAFT', 'PAID'));
  });
});
