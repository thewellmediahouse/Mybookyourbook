import type { ImageMetadata } from 'astro';

export type MediaSrc = ImageMetadata | string;

/** Normalize Astro ImageMetadata or public path string to a URL string. */
export function resolveMediaSrc(value: MediaSrc | undefined | null): string | undefined {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  return value.src;
}

export function isImageMetadata(value: unknown): value is ImageMetadata {
  return typeof value === 'object' && value !== null && 'src' in value && 'width' in value && 'height' in value;
}
