import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildVisualPrompt } from '../../src/ai/design-studio/buildVisualPrompt.ts';
import {
  OpenAIImageError,
  createImageGeneration,
} from '../../src/ai/design-studio/openaiImage.ts';
import {
  buildConceptObjectKey,
  canRetryFailedConcept,
  mapWithConcurrency,
  nextImageFailureCode,
} from '../../src/utils/design-studio/conceptAssets.ts';
import type { ConceptDirection, DesignBrief } from '../../src/types/designStudio.ts';

const brief = {
  businessName: 'Harbour Lights Cafe',
  industry: 'Hospitality',
  businessDescription: 'Waterfront cafe',
  goals: ['Bookings'],
  websiteType: 'brochure',
  primaryStyle: 'Warm',
  colourMode: 'warm',
  features: ['Menu', 'Reservations'],
  pages: ['Home', 'Menu', 'Contact'],
  freeTextBrief: 'Coastal hospitality',
} as DesignBrief;

const direction = {
  id: 'concept-01',
  name: 'Coastal Editorial',
  oneLineConcept: 'Warm waterfront storytelling',
  targetFeeling: ['Warm'],
  layoutDirection: 'Image-forward storytelling',
  heroDirection: 'Atmospheric location imagery',
  typographyDirection: 'Friendly serif headings',
  colourDirection: ['#1C1712', '#E8D5B5'],
  sectionFlow: ['Hero', 'Menu', 'Book'],
  conversionStrategy: 'Reservation CTA',
  visualPrompt: 'Warm coastal cafe homepage',
  differentiators: ['Place-led'],
} as ConceptDirection;

describe('visual prompts + concept image helpers', () => {
  it('buildVisualPrompt includes direction and brief cues', () => {
    const prompt = buildVisualPrompt({
      brief,
      direction,
      hasLogoUpload: false,
      hasReferenceUploads: false,
    });
    assert.match(prompt, /Harbour Lights Cafe/);
    assert.match(prompt, /Coastal Editorial/);
    assert.match(prompt, /logo placeholder/i);
    assert.match(prompt, /Image-forward storytelling/);
  });

  it('buildVisualPrompt mentions uploaded logo when present', () => {
    const prompt = buildVisualPrompt({
      brief,
      direction,
      hasLogoUpload: true,
      hasReferenceUploads: true,
    });
    assert.match(prompt, /uploaded logo/i);
    assert.match(prompt, /reference imagery/i);
  });

  it('buildVisualPrompt shows shop section when Online shop is selected', () => {
    const prompt = buildVisualPrompt({
      brief: {
        ...brief,
        features: ['Online shop', 'Contact form'],
        shopDetails: { productCount: '20–50', productKinds: ['Physical products'] },
      },
      direction,
      hasLogoUpload: false,
    });
    assert.match(prompt, /online shop section/i);
    assert.match(prompt, /product grid/i);
    assert.match(prompt, /Physical products/);
  });

  it('builds deterministic concept object keys', () => {
    assert.equal(
      buildConceptObjectKey('proj-1', 2, 'image/png'),
      'design-studio/proj-1/concepts/concept-02.png',
    );
    assert.equal(
      buildConceptObjectKey('proj-1', 1, 'image/webp'),
      'design-studio/proj-1/concepts/concept-01.webp',
    );
  });

  it('limits failed-slot retries', () => {
    assert.equal(canRetryFailedConcept(null), true);
    assert.equal(canRetryFailedConcept('image_failed'), true);
    assert.equal(canRetryFailedConcept('image_failed_final'), false);
    assert.equal(nextImageFailureCode(null), 'image_failed');
    assert.equal(nextImageFailureCode('image_failed'), 'image_failed_final');
  });

  it('mapWithConcurrency respects pool size and order', async () => {
    const active = { count: 0, max: 0 };
    const results = await mapWithConcurrency([1, 2, 3, 4], 2, async (n) => {
      active.count += 1;
      active.max = Math.max(active.max, active.count);
      await new Promise((r) => setTimeout(r, 20));
      active.count -= 1;
      return n * 10;
    });
    assert.deepEqual(results, [10, 20, 30, 40]);
    assert.ok(active.max <= 2);
  });

  it('createImageGeneration decodes b64_json responses', async () => {
    // Minimal 1x1 PNG
    const png = Uint8Array.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);
    let binary = '';
    for (const byte of png) binary += String.fromCharCode(byte);
    const b64 = btoa(binary);

    const result = await createImageGeneration({
      apiKey: 'test-key',
      model: 'gpt-image-test',
      prompt: 'homepage',
      fetchImpl: async () =>
        new Response(JSON.stringify({ model: 'gpt-image-test', data: [{ b64_json: b64 }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
    });

    assert.equal(result.model, 'gpt-image-test');
    assert.equal(result.mimeType, 'image/png');
    assert.equal(result.usedReferenceImages, false);
    assert.ok(result.bytes.length > 0);
  });

  it('createImageGeneration surfaces missing config', async () => {
    await assert.rejects(
      () => createImageGeneration({ apiKey: '', model: 'x', prompt: 'y' }),
      (error: unknown) =>
        error instanceof OpenAIImageError && error.code === 'openai_not_configured',
    );
  });
});
