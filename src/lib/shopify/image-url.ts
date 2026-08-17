import { uniqueSortedWidths } from '@/utils/responsive-image';

function isShopifyCdn(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return host.includes('cdn.shopify.com') || host.includes('shopifycdn.com');
  } catch {
    return false;
  }
}

/** Request a resized Shopify CDN derivative (`width` query). No-op for other hosts. */
export function shopifyImageUrl(url: string, width: number): string {
  if (!url || !isShopifyCdn(url)) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('width', String(Math.max(1, Math.round(width))));
    return parsed.toString();
  } catch {
    return url;
  }
}

export function shopifyImageSrcset(url: string, widths: number[]): string {
  return uniqueSortedWidths(widths)
    .map((w) => `${shopifyImageUrl(url, w)} ${w}w`)
    .join(', ');
}

export function parseShopifyWidthsAttr(raw: string | undefined | null): number[] {
  if (!raw) return [];
  return uniqueSortedWidths(
    raw
      .split(',')
      .map((part) => Number.parseInt(part.trim(), 10))
      .filter((w) => Number.isFinite(w) && w > 0),
  );
}
