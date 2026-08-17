import type { ImageMetadata } from 'astro';
import { getRasterByKey } from '@/assets/raster';

export type MediaSrc = ImageMetadata | string;

export type ResolvedConfigImage =
  | { kind: 'raster'; src: ImageMetadata }
  | { kind: 'url'; src: string };

/** Normalize Astro ImageMetadata or public path string to a URL string. */
export function resolveMediaSrc(value: MediaSrc | undefined | null): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.src;
}

export function isImageMetadata(value: unknown): value is ImageMetadata {
  return typeof value === 'object' && value !== null && 'src' in value && 'width' in value && 'height' in value;
}

/**
 * Resolve a config image ref: `raster.ts` key (e.g. `hero`, `brand.logo`)
 * or a public/remote URL (`/images/…`, `https://…`).
 */
export function resolveConfigImage(ref: string | undefined | null): ResolvedConfigImage | undefined {
  if (!ref) return undefined;
  if (ref.startsWith('/') || ref.startsWith('http') || ref.startsWith('data:')) {
    return { kind: 'url', src: ref };
  }
  const raster = getRasterByKey(ref);
  if (raster) return { kind: 'raster', src: raster };
  // Unknown key — treat as URL so missing assets fail visibly in the browser
  return { kind: 'url', src: ref };
}
