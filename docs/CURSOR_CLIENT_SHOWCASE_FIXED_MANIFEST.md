# The Well Media House — FIXED Client Showcase Cursor Manifest

## What this fixes

The previous implementation used the card images inside fixed-height wrappers with `object-fit: cover`, so the card edges and bottom glow were cut off.

This updated pack includes safe-padded exact card mockup images and explicit instructions to prevent cropping.

## Goal

Place a premium client credibility showcase directly below the existing statistics section.

The section must look like the approved mockup reference, not like plain images in ordinary cards.

Use these exact card assets:

- `/public/images/client-showcase/simola-card-exact-safe.webp`
- `/public/images/client-showcase/conrad-card-exact-safe.webp`
- `/public/images/client-showcase/well-dream-centre-card-exact-safe.webp`

Reference:
- `/public/images/client-showcase/client-showcase-approved-section-reference.webp`
- `/public/images/client-showcase/full-approved-mockup-reference.webp`

## Critical image rule

DO NOT crop the supplied card images.

For the card images, use:

```css
width: 100%;
height: auto;
object-fit: contain;
display: block;
```

Do NOT use:
```css
height: 100%;
object-fit: cover;
max-height: fixed;
overflow: hidden around the image itself;
```

Do not place the images inside a fixed-height image container.

The supplied WebP files already include:
- card borders
- luxury glow
- text
- badges
- image treatment
- bottom highlights

So they must be displayed as full complete card images.

## Placement

Put this section directly below the existing statistics strip.

Order:
1. Hero
2. Statistics
3. Client showcase section
4. Existing next section

## Section text

Eyebrow:
`CLIENT CREDIBILITY`

Main heading:
`Clients Who Used The Well Media House`

Subheading:
`Trusted by brands, ministries, and businesses that value premium media, strategy, and growth.`

Important:
Make the eyebrow uppercase with gold letter spacing, centered like the mockup.

## Layout

Use a centered max-width container.

Suggested:
```css
.client-showcase {
  padding: 72px 24px 88px;
  background:
    radial-gradient(circle at 50% 0%, rgba(214,168,79,.10), transparent 34%),
    linear-gradient(180deg, #030a14 0%, #071322 100%);
}

.client-showcase-inner {
  max-width: 1480px;
  margin: 0 auto;
}

.client-showcase-header {
  text-align: center;
  margin-bottom: 34px;
}

.client-showcase-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 28px;
  align-items: start;
}

.client-showcase-card {
  background: transparent;
  border: 0;
  padding: 0;
  overflow: visible;
  border-radius: 24px;
  transition: transform .3s ease, filter .3s ease;
}

.client-showcase-card img {
  width: 100%;
  height: auto;
  object-fit: contain;
  display: block;
  border-radius: 24px;
}

.client-showcase-card:hover {
  transform: translateY(-6px);
  filter: drop-shadow(0 20px 38px rgba(214,168,79,.18));
}
```

Tablet:
```css
@media (max-width: 1024px) {
  .client-showcase-grid {
    grid-template-columns: 1fr 1fr;
  }

  .client-showcase-card:nth-child(3) {
    grid-column: 1 / -1;
    max-width: 720px;
    margin: 0 auto;
  }
}
```

Mobile:
```css
@media (max-width: 680px) {
  .client-showcase {
    padding: 54px 16px 64px;
  }

  .client-showcase-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .client-showcase-card:nth-child(3) {
    max-width: none;
  }
}
```

## Example HTML / JSX structure

```jsx
<section className="client-showcase" aria-labelledby="client-showcase-heading">
  <div className="client-showcase-inner">
    <div className="client-showcase-header">
      <div className="section-eyebrow">CLIENT CREDIBILITY</div>
      <h2 id="client-showcase-heading">
        Clients Who Used <span>The Well Media House</span>
      </h2>
      <p>
        Trusted by brands, ministries, and businesses that value premium media, strategy, and growth.
      </p>
    </div>

    <div className="client-showcase-grid">
      <article className="client-showcase-card">
        <img
          src="/images/client-showcase/simola-card-exact-safe.webp"
          alt="Simola Hotel showcase card by The Well Media House"
          loading="lazy"
        />
      </article>

      <article className="client-showcase-card">
        <img
          src="/images/client-showcase/conrad-card-exact-safe.webp"
          alt="Conrad Light showcase card by The Well Media House"
          loading="lazy"
        />
      </article>

      <article className="client-showcase-card">
        <img
          src="/images/client-showcase/well-dream-centre-card-exact-safe.webp"
          alt="The Well Dream Centre showcase card by The Well Media House"
          loading="lazy"
        />
      </article>
    </div>
  </div>
</section>
```

## Tailwind-style guidance

If using Tailwind, ensure the images have:

```txt
w-full h-auto object-contain block rounded-[24px]
```

Avoid:
```txt
h-full object-cover overflow-hidden
```

## Do not do this

- Do not use the raw Simola, Conrad or Facebook images for the cards.
- Do not recreate the text with separate HTML inside the cards.
- Do not crop the card assets.
- Do not put them in fixed-height boxes.
- Do not add The Cool Guy here.
- Do not stretch the images.

## Final visual target

The section should feel like the approved mockup:
- centered heading
- three large luxury cards
- spacious layout
- gold accents
- no cut-off edges
- no plain photo cards
