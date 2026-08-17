/** Shared srcset defaults for Astro rasters and Shopify CDN photos. */

export const MOBILE_IMAGE_MEDIA = '(max-width: 768px)';

export function uniqueSortedWidths(values: number[]): number[] {
  return [...new Set(values.map((w) => Math.max(1, Math.round(w))))].sort((a, b) => a - b);
}

/** Desktop + retina rungs, always including mobile-friendly sizes for large displays. */
export function defaultSrcWidths(displayWidth: number): number[] {
  const w = Math.max(1, Math.round(displayWidth));
  return uniqueSortedWidths([
    Math.min(480, w),
    Math.min(768, w),
    Math.min(1080, w),
    w,
    Math.min(w * 2, 1920),
  ]);
}

/**
 * Extra `<source>` rungs so narrow viewports cannot pick a 1600–1920w file.
 * Omitted for already-small images (avatars, thumbs).
 */
export function defaultMobileWidths(displayWidth: number): number[] | undefined {
  const w = Math.max(1, Math.round(displayWidth));
  if (w <= 480) return undefined;
  return uniqueSortedWidths([480, Math.min(768, w), Math.min(1080, w)]);
}

export function defaultSizes(displayWidth: number): string {
  const w = Math.max(1, Math.round(displayWidth));
  if (w >= 1400) return '100vw';
  return `(max-width: 768px) 100vw, (max-width: 1024px) 90vw, ${w}px`;
}

/** SVG, ICO, and icon-path assets are not worth the Astro raster pipeline. */
export function isUnoptimizableSrc(src: string | undefined | null): boolean {
  if (!src) return true;
  if (src.startsWith('data:')) return true;
  const path = src.split('?')[0]?.toLowerCase() ?? '';
  if (path.endsWith('.svg') || path.endsWith('.ico') || path.endsWith('.gif')) return true;
  return /\/icons?(?:\/|$)/i.test(path);
}
