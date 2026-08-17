/** Soft-clip for share cards when a dedicated OG string is not provided. */
export function clipForShareCard(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  const budget = max - 1;
  const sliced = normalized.slice(0, budget);
  const lastSpace = sliced.lastIndexOf(' ');
  const base = lastSpace > max * 0.55 ? sliced.slice(0, lastSpace) : sliced;
  return `${base.trimEnd()}…`;
}

/** Adjust hex color brightness — amount in range -1..1 */
export function adjustColor(hex: string, amount: number): string {
  const normalized = hex.replace('#', '');
  const num = parseInt(normalized, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(255 * amount)));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * amount)));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

export function resolveCanonicalUrl(siteUrl: string, pathname: string): string {
  const base = siteUrl.replace(/\/$/, '');
  let path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  // Align page paths with astro `trailingSlash: 'always'`, but do not
  // append `/` to asset URLs (`/og-default.svg`, `/_astro/….webp`, etc.).
  const lastSegment = path.split('/').pop() ?? '';
  const looksLikeFile = /\.[a-zA-Z0-9]{2,8}$/.test(lastSegment);
  if (path !== '/' && !path.endsWith('/') && !looksLikeFile) {
    path = `${path}/`;
  }
  return path === '/' ? `${base}/` : `${base}${path}`;
}

export interface SeoProps {
  title: string;
  description: string;
  pathname?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function buildSeoMeta({
  title,
  description,
  pathname = '/',
  ogTitle,
  ogDescription,
  ogImage,
  noindex = false,
}: SeoProps) {
  return {
    title,
    description,
    pathname,
    ogTitle,
    ogDescription,
    ogImage,
    noindex,
  };
}
