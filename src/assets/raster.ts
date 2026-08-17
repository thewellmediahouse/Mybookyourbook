/**
 * Raster asset registry for the Astro image pipeline.
 *
 * Import photography, logos (webp/png/jpg), and OG images from `src/assets/`
 * and export them here. Components pass these `ImageMetadata` values into
 * `OptimizedImage` / `BrandLogo` (or `getImage` for OG).
 *
 * Keep in `public/` only: SVG placeholders, favicons, webmanifest, icon sprites, and video files.
 * Do **not** put jpg/png/webp photos in `public/` or render them with a raw `<img>`.
 *
 * @example
 * import logo from './brand/logo.webp';
 * import hero from './images/hero.webp';
 * import ogDefault from './images/og/og-default.jpg';
 *
 * export const raster = {
 *   brand: { logo },
 *   hero,
 *   // Prefer a real branded photo/promo frame — SEO.astro cover-crops to 1200×630.
 *   og: { default: ogDefault },
 * } as const;
 *
 * // In content: media: { type: 'image', src: 'hero', alt: '…' }
 * // Resolve with getRasterByKey('hero') or getRasterByKey('brand.logo')
 * // Default share image: getRasterByKey('og.default')
 */
import type { ImageMetadata } from 'astro';

export const raster = {} as const;

export type RasterRegistry = typeof raster;

/** Dot-path lookup into `raster` (e.g. `hero`, `brand.logo`). */
export function getRasterByKey(key: string): ImageMetadata | undefined {
  return key.split('.').reduce<unknown>((value, segment) => {
    if (value && typeof value === 'object' && segment in value) {
      return (value as Record<string, unknown>)[segment];
    }
    return undefined;
  }, raster) as ImageMetadata | undefined;
}
