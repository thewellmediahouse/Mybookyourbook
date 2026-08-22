# Platform lookup

On-demand reference for build/debug agents. Always-on contract: [`AGENT.md`](AGENT.md). Do not load this for ChatGPT content fill.

## Repo strategy

| Branch | Role |
| ------ | ---- |
| `main` | Template platform |
| `wellmedia` | Only co-located client site (The Well Media House) |

New sites: **clone to a dedicated repo**. At ~30 sites: plan monorepo (`sites/<name>/`). Keep client content in config/assets only.

## Directory layout

```
src/
  components/ layout|sections|marketing|ui|forms|media|utility|decor|shop
  components/site/   # client-only one-offs (cloned repos) — never on template main
  config/     typed business configuration
  content/    optional MDX
  lib/        optional integrations (e.g. shopify/)
  layouts/    BaseLayout, PageLayout
  pages/      routes
  assets/     rasters + raster.ts
  styles/     global.css + tokens
public/       SVG, favicon, video
docs/         AGENT, PLATFORM, DEPLOY, SHOP, SITE_SPEC.*, prompts/
```

Customization ladder (config → compose → platform generic → `components/site`): see [`AGENT.md`](AGENT.md).

## Page archetypes → sections

Toggle via `pages.ts`. Only enable sections with copy in `content.ts` / related config.

| Page | Typical sections |
| ---- | ---------------- |
| Home | HomeHero, TrustBar?, ImpactStrip, StatementBand?, ServicesPreview, ShopPreview?, ConsultationCTA?, ClosingCta?, FeaturedWork?, Testimonials?, PricingSelector?, FAQ? |
| About | AboutHero, AboutIntro (optional role/credentials/paragraphs/portrait), ServicesIconRow, ProcessSteps, WhyChooseUs, PhasedImplementation?, CTA |
| Services | PageHeader, ServiceGrid (+ optional packageGroups), PackageOverview?, Bundles?, AlaCarte?, Terminology?, CTA |
| Portfolio | PortfolioHero, PortfolioGallery, StatsStrip?, CTA → detail: PortfolioDetail |
| Contact | ContactHero, ContactForm, BookingMockup?, contact info, FAQ?, CTA |
| FAQ | FAQSection |
| Shop | ShopCatalog (or ShopComingSoon), ProductGrid → PDP `/shop/[handle]`, Cart `/cart`; home: ShopPreview? |

## Component inventory

**Layout:** Header, Footer, Navigation, MobileNavigation, AnnouncementBar (+ CartLink when `pages.shop`)  
**Heroes:** HomeHero, AboutHero, PortfolioHero, ContactHero, marketing/Hero  
**Sections:** TrustBar, ImpactStrip, StatementBand, ServicesPreview, ServiceGrid, PackageTierCard, PackageOverview, BundlePackages, AlaCartePricing, PricingTerminology, PricingSelector, ConsultationCTA, ClosingCta, FeaturedWork, AboutIntro, ServicesIconRow, ProcessSteps, WhyChooseUs, PhasedImplementation, PortfolioGallery, PortfolioDetail, StatsStrip, ShopPreview, ShopComingSoon  
**Shop:** ShopCatalog, ProductGrid, ProductCard, ShopifyImage, ProductVariantPicker, AddToCartButton, BuyButton, CartPage, CartLink, LiveStockSync  
**Marketing:** FeatureGrid, CTASection, TestimonialSection, FAQSection  
**UI:** Button, Card, Badge, BrandLogo, OptimizedImage, ConfigImage, HeroHeading, Container, SectionWrapper, SectionHeading, IconCard, Pill  
**Forms:** ContactForm, FormField, SelectField, TextAreaField, FileField, BookingCalendarMockup  
**Media:** PortfolioCard, VideoPlaceholder, PlayButton  
**Utility:** SEO, PageHeader, MessagingBubble, SiteMotion, GoogleTag, MetaPixel  

## Config notes

- `pages.sections.services.bundles|alaCarte|terminology` render only when enabled **and** matching `packagesConfig` arrays are non-empty.
- `pages.shop` gates `/shop`, `/cart`, nav, and header cart; live catalog also requires Storefront env (`docs/SHOP.md`).
- Hero copy uses `HeroContent` (single `<h1>` via `HeroHeading`; optional `headingHighlight`).
- Hero layout: `layout: 'split'` (default, two-column + inset media) or `layout: 'fullBleed'` (edge-to-edge photo/video with overlay copy). Full-bleed uses `media` as the dominant plane; optional `overlayOpacity` (0–1) controls the scrim. Photos: raster key in `media.src` (`raster.ts` + `OptimizedImage`). SVG placeholders in `public/` only until the raster exists. Keep full-bleed copy lean (heading, one paragraph, CTAs) — skip `trustPoints`.
- Dark marketing bands: wrap intentional dark surfaces in `.band-dark` so `text-fg*` stay light on light themes. Home toggles: `trustBar`, `statementBand`, `closingCta` (full-bleed image CTA).
- Optional motion: `pages.motion.enabled` loads `SiteMotion` (scroll reveal + hover lift; respects `prefers-reduced-motion`). Mark stagger groups with `data-motion-stagger`; opt-in roots with `data-motion`.
- Contact map: `pages.sections.contact.map` + `googleMapsEmbedUrl()` / `googleMapsLinkUrl()` from `company.ts`.
- Navigation filters by `pagesConfig` flags; header CTA from `navigation.ts`. Optional `NavItem.children` render as desktop hover dropdowns and nested mobile links.
- Optional announcement strip: `pages.announcement.enabled` + `message` → `AnnouncementBar` above the header.
- Analytics: `analytics.ts` IDs → `GoogleTag` / `MetaPixel` in BaseLayout. Empty ID skips; inject only when `getSiteEnv() === 'production'`.

## Design tokens

1. `site.ts` branding (required)
2. `design.ts` with `enabled: true` for dark/premium extended tokens
3. `branding.ts` → CSS variables on `<html>`
4. `global.css` semantic utilities

**Semantic classes:** `text-fg`, `text-fg-soft`, `text-fg-muted`, `text-fg-subtle`, `text-fg-label`, `text-gradient-gold`, `surface-card`, `surface-panel`, `section-hero`, `hero-fullbleed`, `band-dark`, `section-surface`, `btn-accent`, `filter-pill`, `header-glass`

Fonts: self-host via `@fontsource/*`; preload woff2 in BaseLayout. Avoid Google Fonts CDN.

## Images

**Mindset:** every photo is sized for mobile and desktop from the first commit. Do not add a full-resolution `<img>` and “optimize later.”

| Kind | Location | Render |
| ---- | -------- | ------ |
| Photo, raster logo, OG jpg/png/webp | `src/assets/` + `raster.ts` | `ConfigImage` / `OptimizedImage` / `BrandLogo` |
| Shopify catalog photos | Storefront CDN (remote) | `ShopifyImage` (`width` srcset) |
| SVG logo, inline icons, favicon/ico, video | `public/` | plain `<img>` / `<video>` |
| Meta Pixel 1×1 | remote | plain `<img>` (required by the pixel) |

**Forbidden:** raw `<img src="/images/hero.jpg">` (or any jpg/png/webp in `public/`) for site photography. `ConfigImage` may fall back to `<img>` for SVG/icons/URLs — that is not a license to put photos in `public/`.

Config image fields (`media.src`, portfolio `image`, CTA `image.src`, testimonial `avatar`, shop teaser images, hero `decor.image.src`) take a **raster registry key** (e.g. `hero`). OptimizedImage defaults include 480/768/1080 plus display width, plus a mobile `<source>` so phones cannot pick a 1920w file. Raster logos: `BrandLogo` when `raster.brand.logo` exists.

Always set width/height or aspect; lazy-load non-LCP; one LCP hero; descriptive alt. Default WebP encode quality is **88**; override per image when needed.

## Forms

`form.ts`: `formsubmit` | `formspree` | `web3forms` | `custom`. Default FormSubmit (`endpoint` = email or `PUBLIC_FORMSUBMIT_EMAIL`). Fields/options/messages in config only.

Field types: `text` | `email` | `tel` | `select` | `textarea` | `date` | `file`. Optional per field: `halfWidth`, `section` (heading before field), `hint`, `emptyOptionLabel` (selects), `accept` / `maxSizeMb` / `multiple` (files). ContactForm preserves field order, groups consecutive half-width fields into rows, sets `enctype=multipart/form-data` when any file field is present, and validates `maxSizeMb` client-side for every selected file. Optional props: `formId`, `submitNote`.

## SEO / a11y

- Per-page title + description in `seo.ts`; canonical/OG from `site.ts`
- Prefer branded raster default OG (`raster.og.default`, 1200×630) over placeholder SVG; optional `ogTitle` / `ogDescription` for share cards — see [`go-live.md`](go-live.md)
- One h1 per page; landmarks; labeled inputs; visible focus; WCAG AA contrast on configured neutrals (branding-phase check: `src/utils/contrast.ts`, not a Lighthouse run)
- Prefer JSON-LD via existing utility patterns when present

## Performance (Lighthouse ≥90, target 100)

- Static only; no client JS unless clear value; no heavy third parties
- Optimize images (WebP via Astro assets + default mobile srcset); Shopify CDN `width` for catalog photos; preload LCP only
- `font-display: swap` / self-hosted subset fonts
- Reserve image space (no CLS)
- See [`prompts/04-lighthouse.md`](prompts/04-lighthouse.md)

## Cloudflare Pages

- Build: `npm run build` → `dist`
- Lockfile must satisfy **npm 10.9.x** `npm ci`. Regenerate under npm 10 after dependency changes (`nvm use 22` or `npx npm@10.9.2 install`). Verify: `npx npm@10.9.2 ci`.
- Well Media **preview** provision (private repo, `<repo>.thewellmedia.com`, branch controls, `PUBLIC_SITE_ENV`, wrangler name, API token): [`DEPLOY.md`](DEPLOY.md).
- `PUBLIC_SITE_ENV=preview` → layout `noindex` + `robots.txt` Disallow + omit sitemap; preview `X-Robots-Tag` is merged into `public/_headers` (see `src/utils/site-env.ts`, `astro.config.mjs`). Pair with `PUBLIC_SITE_URL` for the staging host.
- Prefer `trailingSlash: 'always'` so canonicals match sitemap locs; cart and `/thank-you/` are `noindex` and excluded from the sitemap.
- Rename `wrangler.jsonc` `"name"` to match the Pages project before `npm run deploy`.

## Legacy

Human-oriented predecessors live in [`_legacy/`](_legacy/) (archived). Do not use them for new site generation.
