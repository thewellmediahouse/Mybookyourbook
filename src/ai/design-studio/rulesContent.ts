/**
 * Prompt rule text for Workers + Astro.
 * Keep in sync with the companion .md files in this folder.
 */
export const PLATFORM_DESIGN_RULES_TEXT = `# Curated platform design rules (for Design Studio prompts)

Source: generic ideas from docs/AI_TEMPLATE_RULES.md.
Do not include repository strategy, deployment, or Well Media House business copy.

## Design principles to apply to client concepts

- Component-driven section thinking: hero, proof, services, gallery/work, FAQ, CTA
- Content-driven structure: one clear job per section
- Mobile-first responsive layouts with readable type and tap-friendly controls
- Accessibility-conscious contrast, labels, and focus affordances
- SEO-conscious heading hierarchy (one clear primary message above the fold)
- Performance-conscious final implementation mindset: restrained motion, optimized media
- Clear primary CTA plus optional secondary path (WhatsApp, call, book, shop)
- Spacious padding; avoid overcrowded blocks and competing promotions
- Prefer semantic page planning (Home, About, Services, Contact, etc. as needed)
- Conversion-focused hierarchy: value → proof → action
- Reusable section patterns rather than one-off cluttered compositions

## Layout guidance

- Landing and marketing pages should feel like one composed experience, not a dashboard
- Hero should carry brand/product signal, one headline, short support, and CTA group
- Imagery should show product, place, atmosphere, or craft — not empty decoration alone
- Cards only when they aid scanning or interaction; avoid card-everything layouts`;

export const DESIGN_STUDIO_GENERATION_RULES_TEXT = `# Design Studio Generation Rules

The generated output is a visual website direction, not production code and not a deployed website.

## Product positioning

- Create inspiration and a professional creative brief.
- The Well Media House team builds the real website later.
- Concept images are illustrative; final implementation may differ.
- Never imply the mockup is the finished product.

## Every direction must

- Visibly match the client's industry and primary goals
- Use the client's colour and style choices
- Include clear conversion paths (enquiry, booking, WhatsApp, shop, or call — as requested)
- Avoid overcrowding; prefer spacious, premium hierarchy
- Define a distinct hero composition
- Define a distinct typography character
- Define a distinct section rhythm
- Define a distinct content hierarchy
- Be realistic enough for a professional designer to implement on a modern static Astro/Tailwind stack
- Preserve a clean placeholder area for the client's logo
- Respect accessibility: contrast, readable type, obvious CTAs, mobile-first thinking

## Four directions must differ materially

Do not return four colour variations of the same layout.

Vary across the batch:

- Composition and grid
- Spacing and density
- Typography pairing
- Navigation treatment
- Image / media strategy
- Section order
- Card vs non-card treatment
- Conversion emphasis

## Brand boundaries

- Do not apply The Well Media House navy/gold brand unless the visitor explicitly requested navy & gold or similar.
- Do not copy Well Media House copy, taglines, or service packaging into client concepts.
- Do not use The Well Media House business input spec as creative direction for the visitor's website.

## Claims and originality

- Never fabricate awards, customer counts, star ratings, or testimonials.
- Never clone a named competitor pixel-for-pixel.
- Do not recreate copyrighted website screenshots exactly.
- Prefer original layout thinking grounded in the brief.

## Structured output

Return valid structured JSON only, with exactly four concept directions.

Each concept must include:

- id
- name
- oneLineConcept
- targetFeeling
- layoutDirection
- heroDirection
- typographyDirection
- colourDirection
- sectionFlow
- conversionStrategy
- visualPrompt
- differentiators

visualPrompt should describe a full-page or long-scroll desktop homepage concept suitable for an image model: professional web design, strong hierarchy, industry-appropriate imagery mood, requested features implied visually, logo placeholder preserved.`;
