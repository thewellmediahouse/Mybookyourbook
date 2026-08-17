import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { OpenAITextError } from '../../src/ai/design-studio/openaiText.ts';
import { publicOpenAiErrorMessage } from '../../src/server/design-studio/publicErrors.ts';
import { authorizeTeamAccess } from '../../src/server/design-studio/teamAuth.ts';

describe('hardening guards', () => {
  it('rejects team access without a matching service token', () => {
    const env = { DESIGN_STUDIO_TEAM_TOKEN: 'expected-token' } as never;
    const spoofed = new Request('https://example.com', {
      headers: { 'cf-access-authenticated-user-email': 'attacker@example.com' },
    });
    const denied = authorizeTeamAccess(env, spoofed);
    assert.equal(denied.ok, false);

    const allowed = authorizeTeamAccess(
      env,
      new Request('https://example.com', {
        headers: { 'x-design-studio-team-token': 'expected-token' },
      }),
    );
    assert.equal(allowed.ok, true);
  });

  it('sanitizes OpenAI errors for clients', () => {
    const upstream = new OpenAITextError('model xyz quota exploded', 400, 'openai_request_failed');
    assert.equal(
      publicOpenAiErrorMessage(upstream),
      'AI generation failed. Please try again shortly.',
    );
    const timeout = new OpenAITextError('timed out', 504, 'openai_timeout');
    assert.match(publicOpenAiErrorMessage(timeout), /timed out/i);
    const quota = new OpenAITextError('quota', 429, 'openai_quota_exceeded');
    assert.match(publicOpenAiErrorMessage(quota), /billing\/quota/i);
  });
});
