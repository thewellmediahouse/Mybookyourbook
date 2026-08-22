# 04 — Lighthouse loop

## Target

**≥90** on Performance, Accessibility, Best Practices, SEO — desktop **and** mobile. Aim for **100**. Floor is 90 so sites can keep sharper images, richer motion, and more distinctive layout without chasing a 95 tax.

## Rules of engagement

- Static only; no new client JS or third-party scripts unless required to fix a real issue
- Images via OptimizedImage / BrandLogo / ConfigImage (rasters) or ShopifyImage (catalog). SVG/icons/favicon only as raw `<img>`. Size **mobile and desktop from the start** — never a single full-res file.
- Self-hosted fonts only; preload critical woff2; `font-display: swap`
- Semantic theme classes; fix contrast via config neutrals, not `text-neutral-*`
- One h1 per page; labeled form fields; working canonical/OG

## Loop

1. `npm run build && npm run preview`
2. Run Lighthouse (Chrome DevTools or CLI) on `/`, `/about`, `/services`, `/contact` — mobile + desktop
3. Paste failing audits (JSON or list) into chat
4. Agent fixes **only** failing items with minimal diffs
5. Re-run until budgets met or blocked by missing real assets/content (document blockers)

## Common fixes

| Audit | Fix |
| ----- | --- |
| LCP | Smaller hero srcset (mobile rungs), preload LCP image, reduce hero weight |
| Oversized images | Raster keys through OptimizedImage (defaults include mobile widths); Shopify photos via `width` CDN params |
| CLS | Width/height or aspect-ratio on images; avoid late font swap shift |
| Unused JS | Remove islands / defer nonessential scripts |
| Contrast | Adjust `site.branding.neutrals` / design tokens |
| SEO meta | Fill `seo.ts` + `site.url` |
| Tap targets | Spacing on mobile nav/buttons |
