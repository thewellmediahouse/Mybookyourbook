# Agent contract

Canonical always-on rules for AI agents. Deep lookup: [`PLATFORM.md`](PLATFORM.md). Content shape: [`SITE_SPEC.schema.json`](SITE_SPEC.schema.json) → [`SITE_SPEC.example.yaml`](SITE_SPEC.example.yaml).

## Hard constraints

- **Stack:** Astro + TypeScript + Tailwind v4 + MDX. **Static output only.** Deploy: Cloudflare Pages.
- **Lockfile:** `package-lock.json` must work with Pages **npm 10.9.x** `npm ci` (npm stays 10 even if Node is 24).
- **Never add** React, Vue, Angular, Svelte, SSR, databases, or backends unless explicitly requested.
- **Client content** only in `src/config/*`, content files, and assets — never in shared components.
- **Reuse** existing sections/UI; extend, do not fork platform code per client.

## Config map

| Spec key | Config file |
| -------- | ----------- |
| `site` | `site.ts` |
| `company` | `company.ts` |
| `navigation` | `navigation.ts` |
| `services` | `services.ts` |
| `seo` | `seo.ts` |
| `form` | `form.ts` |
| `pages` | `pages.ts` |
| `content` | `content.ts` |
| `design` | `design.ts` (optional; set `enabled: true` for dark/premium) |
| `packages` | `packages.ts` (omit/`null` if unused) |
| `portfolio` | `portfolio.ts` (omit/`null` if unused) |
| `faq` | `faq.ts` |
| `testimonials` | `testimonials.ts` |
| `shop` | `shop.ts` (omit/`null` if unused; Storefront credentials via env) |
| — | `analytics.ts` (optional; empty IDs disable; production-only inject) |
| — | `thank-you.ts` (conversion landing; noindex, not in nav) |
| `assets` | paths + `src/assets/raster.ts` |

Composition: enable pages/sections in `pages.ts` only when copy exists in the spec.

Optional ecommerce: [`SHOP.md`](SHOP.md) (Shopify headless — Approach B).

Production cutover / Open Graph: [`go-live.md`](go-live.md) (after preview provision in [`DEPLOY.md`](DEPLOY.md)).

## Customization ladder

Escalate only when the layer above cannot express the need:

| Need | Do | Where |
| ---- | -- | ----- |
| Copy, brand, pages, section on/off | Spec → config / `pages.ts` | Always |
| Section order / composition | Compose existing sections in `src/pages/*` | Site repo |
| Reusable new block (2+ sites) | Generic section + config keys; note in `PLATFORM.md` | Template `main` |
| One-off layout/UI for this client | `src/components/site/*` only — never push to template | Site repo |
| Unlike any archetype | New page; still config-driven copy; `archetype: custom` + note in `additionalNotes` | Site repo |

**Promote to platform** only when the pattern stays useful after removing client name, logo, and colors. Record site-local work in SITE_SPEC `additionalNotes` (e.g. `custom: HomeHeroVariant — site-local`).

## Style / media / forms

- Semantic classes only: `text-fg`, `text-fg-muted`, `text-fg-soft`, `surface-card`, `btn-accent`. **Never** `text-neutral-*` or `bg-white`.
- Brand flow: `site.ts` branding → `branding.ts` CSS vars → `global.css`.
- Rasters → `src/assets/` + `raster.ts` + `OptimizedImage` / `BrandLogo` / `ConfigImage`. Optimize **desktop and mobile from the start** (default srcset). Raw `<img>` and `public/` jpg/png/webp are forbidden except SVG, favicon/ico, icons, video, and 1×1 tracking pixels. Shopify photos → `ShopifyImage`.
- Branding contrast: `src/utils/contrast.ts` during color setup (not Lighthouse). Fail AA → ask “Are you sure?” before writing.
- Forms via `form.ts`. Default provider: **FormSubmit**.

## New site workflow

0. Provision repo + Cloudflare Pages preview ([`DEPLOY.md`](DEPLOY.md); skill `site-provision`; `scripts/provision-site.sh`) — private GitHub, invite `thewellmediahouse`, `<repo>.thewellmedia.com`, `PUBLIC_SITE_ENV=preview`.
1. Obtain validated `SITE_SPEC.yaml` (ChatGPT pack: [`prompts/01-fill-spec.md`](prompts/01-fill-spec.md)).
2. Apply → `src/config/*` ([`prompts/02-apply-spec.md`](prompts/02-apply-spec.md)).
3. Place assets ([`prompts/03-assets.md`](prompts/03-assets.md)); wire `raster.ts`.
4. `npm run check && npm run build`.
5. Lighthouse desktop + mobile ([`prompts/04-lighthouse.md`](prompts/04-lighthouse.md)) → fix to **≥90**, target **100**.

## Diff discipline

Config-first. Minimal diffs. Match local naming/imports. No unrelated edits.

## Success

Site launches by changing config, assets, and spec-driven content — no architectural changes to shared components.
