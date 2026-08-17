import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mapTurnstileErrorCodes,
  verifyTurnstileToken,
} from '../../src/server/design-studio/turnstile.ts';

describe('turnstile', () => {
  it('maps Cloudflare error codes to user-safe messages', () => {
    const mapped = mapTurnstileErrorCodes(['timeout_or_duplicate']);
    assert.equal(mapped.code, 'timeout_or_duplicate');
    assert.match(mapped.message, /expired/i);
  });

  it('rejects missing secret or token without calling the network', async () => {
    const noSecret = await verifyTurnstileToken({
      secret: '',
      token: 'abc',
      fetchImpl: async () => {
        throw new Error('should not fetch');
      },
    });
    assert.equal(noSecret.ok, false);
    if (!noSecret.ok) assert.equal(noSecret.code, 'turnstile_not_configured');

    const noToken = await verifyTurnstileToken({
      secret: 'secret',
      token: '',
      fetchImpl: async () => {
        throw new Error('should not fetch');
      },
    });
    assert.equal(noToken.ok, false);
    if (!noToken.ok) assert.equal(noToken.code, 'missing_turnstile_token');
  });

  it('parses success and failure siteverify responses', async () => {
    const ok = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      fetchImpl: async () =>
        new Response(JSON.stringify({ success: true, hostname: 'localhost' }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    });
    assert.equal(ok.ok, true);

    const bad = await verifyTurnstileToken({
      secret: 'secret',
      token: 'token',
      fetchImpl: async () =>
        new Response(
          JSON.stringify({ success: false, 'error-codes': ['invalid_input_response'] }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    });
    assert.equal(bad.ok, false);
    if (!bad.ok) {
      assert.equal(bad.code, 'invalid_input_response');
      assert.match(bad.message, /try again/i);
    }
  });
});
