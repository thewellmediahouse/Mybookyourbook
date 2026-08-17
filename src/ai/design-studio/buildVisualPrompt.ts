import type { ConceptDirection, DesignBrief } from '@/types/designStudio';

function includesShop(brief: DesignBrief): boolean {
  if (brief.websiteType === 'Online store') return true;
  return (brief.features ?? []).includes('Online shop');
}

/**
 * Build a concrete homepage visual prompt from the structured direction + brief.
 * Prefer this over freestyle use of the raw wizard answers.
 */
export function buildVisualPrompt(input: {
  brief: DesignBrief;
  direction: ConceptDirection;
  hasLogoUpload?: boolean;
  hasReferenceUploads?: boolean;
}): string {
  const { brief, direction } = input;
  const industry = (brief.customIndustry || brief.industry || 'business').trim();
  const audience = (brief.market || 'their ideal customers').trim();
  const features = (brief.features || []).slice(0, 8).join(', ') || 'clear primary call to action';
  const pages = (brief.pages || []).slice(0, 6).join(', ');
  const colours = (direction.colourDirection || []).join(', ') || brief.colourMode || 'cohesive brand palette';
  const avoid = (brief.avoid || '').trim();
  const withShop = includesShop(brief);

  const logoInstruction = input.hasLogoUpload
    ? 'Incorporate the uploaded logo subtly in the header; keep it crisp and legible.'
    : 'Reserve a clean rectangular logo placeholder in the header (generic mark, no invented brand name).';

  const referenceInstruction = input.hasReferenceUploads
    ? 'Use uploaded reference imagery only as mood/style guidance — do not copy any screenshot pixel-for-pixel.'
    : 'Use original, industry-appropriate imagery mood; do not invent fake awards, star ratings, or customer counts.';

  const shopInstruction = withShop
    ? [
        'CRITICAL: Show a clear online shop section in the UPPER half of the page (just below the hero) so it is visible in a cropped preview.',
        'Include a product grid (3–6 product cards with prices), cart icon in the header, and a shop/store nav item.',
        brief.shopDetails?.productCount
          ? `Suggest roughly ${brief.shopDetails.productCount} products.`
          : null,
        brief.shopDetails?.productKinds?.length
          ? `Product kinds: ${brief.shopDetails.productKinds.join(', ')}.`
          : null,
      ]
        .filter(Boolean)
        .join(' ')
    : null;

  // Keep prompts short — longer prompts slow gpt-image-2 without improving card previews.
  const lines = [
    'Tall portrait desktop website homepage mockup (browser window), long-scroll, photorealistic UI.',
    'Frame the full page in a consistent vertical 2:3 composition — do not crop awkwardly or stretch.',
    `${brief.businessName || 'Client'} · ${industry} · for ${audience}.`,
    `${direction.name}: ${direction.layoutDirection}. Hero: ${direction.heroDirection}.`,
    `Type: ${direction.typographyDirection}. Colours: ${colours}.`,
    `Sections: ${(direction.sectionFlow || []).slice(0, 5).join(' → ')}.`,
    `Style: ${brief.primaryStyle}${brief.secondaryStyle ? ` + ${brief.secondaryStyle}` : ''}.`,
    features ? `Features: ${features}.` : null,
    pages ? `Nav: ${pages}.` : null,
    direction.visualPrompt ? `Mood: ${String(direction.visualPrompt).slice(0, 120)}` : null,
    shopInstruction,
    brief.existingWebsiteUrl?.trim()
      ? `Evolve beyond their current site — fresher, clearer, not a clone.`
      : null,
    logoInstruction,
    referenceInstruction,
    'Placeholder copy only. No fake awards or copyrighted sites.',
    avoid ? `Avoid: ${avoid}.` : null,
  ].filter(Boolean);

  return lines.join('\n');
}
