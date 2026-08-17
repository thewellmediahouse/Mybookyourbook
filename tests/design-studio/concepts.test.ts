import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateConceptResponse } from '../../src/utils/design-studio/validateConceptResponse.ts';
import { OpenAITextError, createChatCompletion } from '../../src/ai/design-studio/openaiText.ts';

const validBatch = {
  concepts: [
    {
      id: 'concept-01',
      name: 'Editorial Authority',
      oneLineConcept: 'Quiet luxury with clear trust signals.',
      targetFeeling: ['Premium', 'Calm'],
      layoutDirection: 'Asymmetric editorial grid',
      heroDirection: 'Full-bleed photography',
      typographyDirection: 'Serif display + sans body',
      colourDirection: ['#0B1220', '#F5F1EA'],
      sectionFlow: ['Hero', 'Proof', 'Services', 'CTA'],
      conversionStrategy: 'Consultation CTA above the fold',
      visualPrompt: 'A premium homepage concept with large photography',
      differentiators: ['Editorial pacing', 'Trust strip'],
    },
    {
      id: 'concept-02',
      name: 'Bold Conversion',
      oneLineConcept: 'Sales-led layout with direct enquiry paths.',
      targetFeeling: ['Energetic', 'Clear'],
      layoutDirection: 'Stacked conversion sections',
      heroDirection: 'Headline plus dual CTAs',
      typographyDirection: 'Bold sans',
      colourDirection: ['#0A1628', '#1EA7FF'],
      sectionFlow: ['Hero', 'Offer', 'Benefits', 'Contact'],
      conversionStrategy: 'Lead form and WhatsApp',
      visualPrompt: 'A high-conversion homepage concept',
      differentiators: ['Offer-first hero', 'Fast enquiry'],
    },
    {
      id: 'concept-03',
      name: 'Warm Destination',
      oneLineConcept: 'Welcoming place-based storytelling.',
      targetFeeling: ['Warm', 'Local'],
      layoutDirection: 'Image-forward storytelling',
      heroDirection: 'Atmospheric location imagery',
      typographyDirection: 'Friendly serif headings',
      colourDirection: ['#1C1712', '#E8D5B5'],
      sectionFlow: ['Hero', 'Experience', 'Gallery', 'Bookings'],
      conversionStrategy: 'Booking CTA plus WhatsApp',
      visualPrompt: 'A warm hospitality homepage concept',
      differentiators: ['Place-led imagery', 'Booking focus'],
    },
    {
      id: 'concept-04',
      name: 'Cinematic Showcase',
      oneLineConcept: 'Dark immersive portfolio direction.',
      targetFeeling: ['Dramatic', 'Crafted'],
      layoutDirection: 'Full-bleed media grid',
      heroDirection: 'Cinematic still hero',
      typographyDirection: 'Minimal display type',
      colourDirection: ['#050A18', '#D9A441'],
      sectionFlow: ['Hero', 'Work', 'Process', 'Contact'],
      conversionStrategy: 'Soft CTA after portfolio',
      visualPrompt: 'A cinematic portfolio homepage concept',
      differentiators: ['Media-first grid', 'Craft narrative'],
    },
  ],
};

describe('concept validation + openai text helper', () => {
  it('accepts a valid four-concept batch', () => {
    const result = validateConceptResponse(validBatch);
    assert.equal(result.ok, true);
    assert.equal(result.value?.concepts.length, 4);
  });

  it('rejects colour-only sameness and wrong counts', () => {
    const tooFew = validateConceptResponse({ concepts: validBatch.concepts.slice(0, 2) });
    assert.equal(tooFew.ok, false);

    const sameLayout = {
      concepts: validBatch.concepts.map((c, i) => ({
        ...c,
        id: `concept-0${i + 1}`,
        name: `Variant ${i + 1}`,
        layoutDirection: 'Same layout',
        heroDirection: 'Same hero',
      })),
    };
    const same = validateConceptResponse(sameLayout);
    assert.equal(same.ok, false);
  });

  it('createChatCompletion parses a successful OpenAI-shaped response', async () => {
    const result = await createChatCompletion({
      apiKey: 'test-key',
      model: 'gpt-test',
      messages: [{ role: 'user', content: 'hi' }],
      fetchImpl: async () =>
        new Response(
          JSON.stringify({
            model: 'gpt-test',
            choices: [{ message: { content: '{"ok":true}' } }],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } },
        ),
    });
    assert.equal(result.content, '{"ok":true}');
    assert.equal(result.model, 'gpt-test');
  });

  it('createChatCompletion surfaces configuration and API errors', async () => {
    await assert.rejects(
      () =>
        createChatCompletion({
          apiKey: '',
          model: 'gpt-test',
          messages: [],
        }),
      (error: unknown) => error instanceof OpenAITextError && error.code === 'openai_not_configured',
    );

    await assert.rejects(
      () =>
        createChatCompletion({
          apiKey: 'test-key',
          model: 'gpt-test',
          messages: [],
          fetchImpl: async () =>
            new Response(JSON.stringify({ error: { message: 'bad key' } }), {
              status: 401,
              headers: { 'content-type': 'application/json' },
            }),
        }),
      (error: unknown) => error instanceof OpenAITextError && error.code === 'openai_request_failed',
    );
  });
});
