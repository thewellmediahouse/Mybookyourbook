/** Escape text for safe insertion into HTML markup strings. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Allow only http(s) image URLs (e.g. Shopify CDN). */
export function safeHttpUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Safe relative shop path from a product handle (trailing slash). */
export function shopProductPath(handle: string): string {
  const safe = handle.replace(/[^a-zA-Z0-9-_]/g, '');
  return safe ? `/shop/${safe}/` : '/shop/';
}
