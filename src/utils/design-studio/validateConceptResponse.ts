import type {
  ConceptBatch,
  ConceptDirection,
  DesignBrief,
  ValidationResult,
} from '@/types/designStudio';

const REQUIRED_CONCEPT_KEYS: Array<keyof ConceptDirection> = [
  'id',
  'name',
  'oneLineConcept',
  'targetFeeling',
  'layoutDirection',
  'heroDirection',
  'typographyDirection',
  'colourDirection',
  'sectionFlow',
  'conversionStrategy',
  'visualPrompt',
  'differentiators',
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringArray(value: unknown, min = 1): value is string[] {
  return (
    Array.isArray(value) &&
    value.length >= min &&
    value.every((item) => isNonEmptyString(item))
  );
}

function validateConceptDirection(
  value: unknown,
  index: number,
): ValidationResult<ConceptDirection> {
  const errors: string[] = [];
  if (!value || typeof value !== 'object') {
    return { ok: false, errors: [`Concept ${index + 1} must be an object.`] };
  }

  const concept = value as Record<string, unknown>;

  for (const key of REQUIRED_CONCEPT_KEYS) {
    if (!(key in concept)) {
      errors.push(`Concept ${index + 1} is missing "${key}".`);
    }
  }

  if (!isNonEmptyString(concept.id)) errors.push(`Concept ${index + 1}: id is required.`);
  if (!isNonEmptyString(concept.name)) errors.push(`Concept ${index + 1}: name is required.`);
  if (!isNonEmptyString(concept.oneLineConcept)) {
    errors.push(`Concept ${index + 1}: oneLineConcept is required.`);
  }
  if (!isStringArray(concept.targetFeeling)) {
    errors.push(`Concept ${index + 1}: targetFeeling must be a non-empty string array.`);
  }
  if (!isNonEmptyString(concept.layoutDirection)) {
    errors.push(`Concept ${index + 1}: layoutDirection is required.`);
  }
  if (!isNonEmptyString(concept.heroDirection)) {
    errors.push(`Concept ${index + 1}: heroDirection is required.`);
  }
  if (!isNonEmptyString(concept.typographyDirection)) {
    errors.push(`Concept ${index + 1}: typographyDirection is required.`);
  }
  if (!isStringArray(concept.colourDirection)) {
    errors.push(`Concept ${index + 1}: colourDirection must be a non-empty string array.`);
  }
  if (!isStringArray(concept.sectionFlow)) {
    errors.push(`Concept ${index + 1}: sectionFlow must be a non-empty string array.`);
  }
  if (!isNonEmptyString(concept.conversionStrategy)) {
    errors.push(`Concept ${index + 1}: conversionStrategy is required.`);
  }
  if (!isNonEmptyString(concept.visualPrompt)) {
    errors.push(`Concept ${index + 1}: visualPrompt is required.`);
  }
  if (!isStringArray(concept.differentiators)) {
    errors.push(`Concept ${index + 1}: differentiators must be a non-empty string array.`);
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      id: String(concept.id).trim(),
      name: String(concept.name).trim(),
      oneLineConcept: String(concept.oneLineConcept).trim(),
      targetFeeling: concept.targetFeeling as string[],
      layoutDirection: String(concept.layoutDirection).trim(),
      heroDirection: String(concept.heroDirection).trim(),
      typographyDirection: String(concept.typographyDirection).trim(),
      colourDirection: concept.colourDirection as string[],
      sectionFlow: concept.sectionFlow as string[],
      conversionStrategy: String(concept.conversionStrategy).trim(),
      visualPrompt: String(concept.visualPrompt).trim(),
      differentiators: concept.differentiators as string[],
      ...(isNonEmptyString(concept.bestFor) ? { bestFor: concept.bestFor.trim() } : {}),
      ...(isStringArray(concept.mockPalette, 0)
        ? { mockPalette: concept.mockPalette as string[] }
        : {}),
      ...(isNonEmptyString(concept.mockAccent) ? { mockAccent: concept.mockAccent.trim() } : {}),
    },
    errors: [],
  };
}

/**
 * Validate strategist model output: exactly four distinct concept directions.
 */
export function validateConceptResponse(input: unknown): ValidationResult<ConceptBatch> {
  const errors: string[] = [];

  if (!input || typeof input !== 'object') {
    return { ok: false, errors: ['Concept response must be an object.'] };
  }

  const record = input as Record<string, unknown>;
  const conceptsRaw = record.concepts;

  if (!Array.isArray(conceptsRaw)) {
    return { ok: false, errors: ['Concept response must include a concepts array.'] };
  }

  if (conceptsRaw.length !== 4) {
    return {
      ok: false,
      errors: [`Expected exactly 4 concepts, received ${conceptsRaw.length}.`],
    };
  }

  const concepts: ConceptDirection[] = [];
  conceptsRaw.forEach((item, index) => {
    const result = validateConceptDirection(item, index);
    if (!result.ok || !result.value) {
      errors.push(...result.errors);
      return;
    }
    concepts.push(result.value);
  });

  if (errors.length) return { ok: false, errors };

  const names = new Set(concepts.map((c) => c.name.toLowerCase()));
  if (names.size < 4) {
    errors.push('Concept names must be unique.');
  }

  const layouts = new Set(concepts.map((c) => c.layoutDirection.toLowerCase()));
  const heroes = new Set(concepts.map((c) => c.heroDirection.toLowerCase()));
  if (layouts.size < 3 && heroes.size < 3) {
    errors.push(
      'Concepts must differ in layout and hero direction — avoid four colour-only variations.',
    );
  }

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      concepts: concepts as ConceptBatch['concepts'],
    },
    errors: [],
  };
}

export function validateBriefForGeneration(
  brief: Partial<DesignBrief>,
): ValidationResult<DesignBrief> {
  const errors: string[] = [];

  if (!isNonEmptyString(brief.businessName)) errors.push('Business name is required.');
  if (!isNonEmptyString(brief.industry)) errors.push('Industry is required.');
  if (brief.industry === 'Other' && !isNonEmptyString(brief.customIndustry)) {
    errors.push('Custom industry is required when Industry is Other.');
  }
  if (!isNonEmptyString(brief.businessDescription) || brief.businessDescription!.trim().length < 20) {
    errors.push('Business description must be at least 20 characters.');
  }
  if (!isStringArray(brief.goals)) errors.push('Select at least one goal.');
  if (!isNonEmptyString(brief.websiteType)) errors.push('Website type is required.');
  if (!isNonEmptyString(brief.primaryStyle)) errors.push('Primary style is required.');
  if (!isNonEmptyString(brief.colourMode)) errors.push('Colour mode is required.');
  if (
    brief.colourMode === 'Custom colours' &&
    !(brief.customColours && brief.customColours.length >= 1)
  ) {
    errors.push('Add at least one custom colour.');
  }
  if (!isStringArray(brief.features)) errors.push('Select at least one feature.');
  if (!(brief.pages?.length || brief.customPages?.length)) {
    errors.push('Select or add at least one page.');
  }
  if (!isNonEmptyString(brief.freeTextBrief) || brief.freeTextBrief!.trim().length < 30) {
    errors.push('Dream website brief must be at least 30 characters.');
  }
  if (!brief.acceptedTerms) errors.push('Terms and Privacy agreement is required.');

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: brief as DesignBrief,
    errors: [],
  };
}
