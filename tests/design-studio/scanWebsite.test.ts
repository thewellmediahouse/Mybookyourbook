import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { scanExistingWebsite } from '../../src/server/design-studio/scanWebsite.ts';

describe('scanExistingWebsite', () => {
  it('rejects private / invalid hosts', async () => {
    const blocked = await scanExistingWebsite('http://127.0.0.1/admin');
    assert.equal(blocked.ok, false);
    assert.equal(blocked.error, 'invalid_url');
  });

  it('extracts title, description, headings, and logo candidates', async () => {
    const html = `<!doctype html>
      <html><head>
        <title>Harbour Lights Cafe</title>
        <meta name="description" content="Waterfront dining in Jeffreys Bay" />
        <meta property="og:image" content="/images/og.jpg" />
        <link rel="icon" href="/favicon.png" />
      </head>
      <body>
        <h1>Welcome to Harbour Lights</h1>
        <h2>Fresh seafood daily</h2>
        <img src="/brand-logo.png" alt="Harbour Lights logo" />
        <p>Book a table by the water.</p>
      </body></html>`;

    const result = await scanExistingWebsite('https://example.com/cafe', async () => {
      return new Response(html, {
        status: 200,
        headers: { 'content-type': 'text/html' },
      });
    });

    assert.equal(result.ok, true);
    assert.equal(result.title, 'Harbour Lights Cafe');
    assert.match(result.description || '', /Waterfront dining/);
    assert.ok((result.headings || []).some((h) => /Harbour Lights/i.test(h)));
    assert.ok((result.logoCandidateUrls || []).some((u) => u.includes('og.jpg')));
    assert.ok((result.logoCandidateUrls || []).some((u) => u.includes('brand-logo.png')));
  });
});
