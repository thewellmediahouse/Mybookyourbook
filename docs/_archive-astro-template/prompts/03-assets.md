# 03 — Assets

## Goal

Place generated/brand images and wire them for Astro optimization and Lighthouse.

## Rules

| Asset type | Location | Wiring |
| ---------- | -------- | ------ |
| Raster photos, raster logos, OG jpg/png/webp | `src/assets/...` | `raster.ts` + `ConfigImage` / `OptimizedImage` / `BrandLogo` — desktop **and** mobile srcset from the start |
| Shopify catalog photos | Storefront CDN | `ShopifyImage` |
| SVG logo, favicon/ico, icons, video | `public/` | `/logo.svg` etc. — the **only** allowed raw `<img>` media |

**Do not** put photos in `public/` or emit raw `<img>` for jpg/png/webp. SVG placeholders in `public/images/` are fine until the real raster lands in `src/assets/`.

## Steps

1. Read `assets[]` from `SITE_SPEC.yaml`.
2. Drop files at the listed paths (create folders as needed).
3. For each raster: add import/export in `raster.ts`; point config/`content.ts` media fields at **registry keys**. Sections use `ConfigImage`. Do not leave photos as public paths.
4. Set descriptive `alt` from spec; never empty for informative images.
5. LCP hero: eager / high priority only for the home hero; all others lazy.
6. Header uses `BrandLogo` when `raster.brand.logo` exists; otherwise SVG in `public/` is the placeholder.
7. If an image is missing, keep a clearly named SVG placeholder and a TBD note — do not invent stock URLs or drop a full-size JPEG in `public/`.

## Roles (convention)

`logo`, `logo-white`, `favicon`, `og`, `hero`, `about-hero`, `contact-hero`, `cta`, `service:<slug>`, `portfolio:<slug>`

**Default Open Graph:** put the branded share photo at `src/assets/...` and export as `raster.og.default`. `SEO.astro` cover-crops it to 1200×630. Prefer a real promo/hero frame over shipping `public/og-default.svg` long-term — see [`go-live.md`](../go-live.md) §1.5.1.
