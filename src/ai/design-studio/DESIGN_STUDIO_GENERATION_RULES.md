# Design Studio Generation Rules

Prompt version companion: keep in sync with `DESIGN_STUDIO_PROMPT_VERSION`.

The generated output is a **visual website direction**, not production code and not a deployed website.

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

Do **not** return four colour variations of the same layout.

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

- Do **not** apply The Well Media House navy/gold brand unless the visitor explicitly requested navy & gold or similar.
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

`visualPrompt` should describe a full-page or long-scroll desktop homepage concept suitable for an image model: professional web design, strong hierarchy, industry-appropriate imagery mood, requested features implied visually, logo placeholder preserved.

Text rendered inside generated images may be imperfect — accurate titles and rationale will be shown in HTML beside the visual.
