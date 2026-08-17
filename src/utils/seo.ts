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
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${base}${path === '/' ? '' : path}`;
}

export interface SeoProps {
  title: string;
  description: string;
  pathname?: string;
  ogImage?: string;
  noindex?: boolean;
}

export function buildSeoMeta({
  title,
  description,
  pathname = '/',
  ogImage,
  noindex = false,
}: SeoProps) {
  return {
    title,
    description,
    pathname,
    ogImage,
    noindex,
  };
}
