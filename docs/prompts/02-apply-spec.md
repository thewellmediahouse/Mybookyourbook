# 02 — Apply SITE_SPEC (Cursor / developer)

## Goal

Apply a filled `SITE_SPEC.yaml` into this template’s `src/config/*` and related assets wiring. No architecture changes.

## Inputs

- `SITE_SPEC.yaml` at repo root or `docs/SITE_SPEC.yaml`
- Schema: `docs/SITE_SPEC.schema.json`
- Example: `docs/SITE_SPEC.example.yaml`
- Contract: `docs/AGENT.md`
- Lookup: `docs/PLATFORM.md` only if a section/component mapping is unclear

## Steps

1. Read the YAML. Treat `null` / omitted optional blocks as **disabled** — do not leave stale Acme portfolio/pricing enabled.
2. Map keys → config files per `AGENT.md` config table.
3. Update:
   - `site.ts`, `company.ts`, `services.ts`, `seo.ts`, `form.ts`, `faq.ts`
   - `pages.ts` (page flags + `sections` exactly as spec)
   - `content.ts` (shared + per-page copy; resolve `USE_SITE_LONG_DESCRIPTION` → `siteConfig.longDescription`)
   - `navigation.ts` CTA labels; nav items follow `pagesConfig` filters
   - `testimonials.ts` if present; else empty array / disable section
   - `packages.ts` / `portfolio.ts` / `shop.ts` / `design.ts` only when spec is non-null (`design.enabled` for dark/premium; shop credentials stay in `PUBLIC_SHOPIFY_*` env — see `docs/SHOP.md`)
4. Resolve `assets[].role` → raster keys in content/media fields. Photos go in `src/assets` + `raster.ts`. SVG/favicon/icons/video stay in `public/`. Never leave a photo as a `public/` jpg/png/webp.
5. Keep FormSubmit default unless spec says otherwise; wire `optionsFrom: services` to existing helpers.
6. Do not add React/SSR/new frameworks. Reuse components; minimal diffs.
7. Custom UI: follow `AGENT.md` customization ladder — prefer config/composition; one-offs → `src/components/site/*` only; promote to platform only if reusable without client branding.
8. Run `npm run check` and `npm run build`. Fix type errors.
9. Summarize TBD items and any site-local custom components left for the client.

## Done when

- Config matches spec
- Disabled features are off in `pages.ts` and empty/unused where appropriate
- Build passes
- Remaining `tbd` listed for humans
