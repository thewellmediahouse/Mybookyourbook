import { buildDesignBrief } from '@/ai/design-studio/buildDesignBrief';
import { getDesignStudioGenerationPolicy } from '@/ai/design-studio/generationRules';
import { createChatCompletion, OpenAITextError } from '@/ai/design-studio/openaiText';
import type { ConceptBatch, DesignBrief, WebsiteScanBrief } from '@/types/designStudio';
import { validateConceptResponse } from '@/utils/design-studio/validateConceptResponse';

const OUTPUT_SCHEMA_INSTRUCTIONS = `Return a JSON object with this exact shape:
{
  "concepts": [
    {
      "id": "string",
      "name": "string",
      "oneLineConcept": "string",
      "targetFeeling": ["string"],
      "layoutDirection": "string",
      "heroDirection": "string",
      "typographyDirection": "string",
      "colourDirection": ["#hex or colour name"],
      "sectionFlow": ["string"],
      "conversionStrategy": "string",
      "visualPrompt": "string",
      "differentiators": ["string"]
    }
  ]
}

Requirements:
- concepts must contain exactly 4 items
- each concept must be materially different (not colour-only variations)
- ids should be concept-01 through concept-04
- visualPrompt must be ONE short sentence (under 20 words) of art-direction mood only — not a long image brief
- oneLineConcept must be one short sentence
- conversionStrategy and layoutDirection: one short sentence each
- do not include markdown fences or commentary outside JSON`;

function parseJsonObject(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch {
    const start = content.indexOf('{');
    const end = content.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(content.slice(start, end + 1));
    }
    throw new Error('Model output was not valid JSON.');
  }
}

async function requestConceptBatch(input: {
  apiKey: string;
  model: string;
  brief: DesignBrief;
  websiteScan?: WebsiteScanBrief | null;
  repairHint?: string;
  fetchImpl?: typeof fetch;
}): Promise<{ batch: ConceptBatch; model: string; raw: string }> {
  const structuredBrief = buildDesignBrief(input.brief, input.websiteScan);
  const policy = getDesignStudioGenerationPolicy();

  const userParts = [
    'Create exactly four distinct website directions for this visitor brief.',
    '',
    '## Visitor brief (JSON)',
    JSON.stringify(structuredBrief, null, 2),
  ];

  if (input.websiteScan) {
    userParts.push(
      '',
      '## Existing website research',
      'The visitor provided their current website. Use the scan data as research only:',
      '- Improve messaging clarity, trust, and conversion vs the old site',
      '- Carry forward useful brand cues (tone, themes, services mentioned)',
      '- If a logo was imported, assume it will appear in the header',
      '- Do NOT clone or pixel-copy the old layout',
      JSON.stringify(input.websiteScan, null, 2),
    );
  }

  userParts.push('', OUTPUT_SCHEMA_INSTRUCTIONS);

  if (input.repairHint) {
    userParts.push('', '## Repair instructions', input.repairHint);
  }

  const completion = await createChatCompletion({
    apiKey: input.apiKey,
    model: input.model,
    fetchImpl: input.fetchImpl,
    // Four detailed concept directions on GPT-5.x regularly exceed 60s.
    timeoutMs: 180_000,
    messages: [
      { role: 'system', content: policy },
      { role: 'user', content: userParts.join('\n') },
    ],
  });

  const parsed = parseJsonObject(completion.content);
  const validated = validateConceptResponse(parsed);
  if (!validated.ok || !validated.value) {
    throw new Error(validated.errors.join(' '));
  }

  return {
    batch: validated.value,
    model: completion.model,
    raw: completion.content,
  };
}

/**
 * Generate four validated concept directions.
 * Retries once with a repair prompt if validation fails.
 */
export async function buildConceptDirections(input: {
  apiKey: string;
  model: string;
  brief: DesignBrief;
  websiteScan?: WebsiteScanBrief | null;
  fetchImpl?: typeof fetch;
}): Promise<{
  batch: ConceptBatch;
  model: string;
  repaired: boolean;
}> {
  try {
    const first = await requestConceptBatch(input);
    return { batch: first.batch, model: first.model, repaired: false };
  } catch (firstError) {
    if (firstError instanceof OpenAITextError) {
      throw firstError;
    }

    const repairHint = [
      'Your previous response failed validation.',
      firstError instanceof Error ? firstError.message : 'Unknown validation error.',
      'Return corrected JSON only with exactly four distinct concepts.',
    ].join(' ');

    try {
      const second = await requestConceptBatch({ ...input, repairHint });
      return { batch: second.batch, model: second.model, repaired: true };
    } catch (secondError) {
      if (secondError instanceof OpenAITextError) {
        throw secondError;
      }
      throw new OpenAITextError(
        'AI returned invalid concept directions after retry.',
        502,
        'openai_invalid_concepts',
      );
    }
  }
}
