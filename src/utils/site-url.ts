import { siteConfig } from '@/config/site';

/** Canonical site origin for absolute URLs (SEO, sitemap, OG). */
export function getSiteUrl(site?: URL | string | null): string {
  if (site instanceof URL) {
    return site.href.replace(/\/$/, '');
  }

  if (typeof site === 'string' && site.length > 0) {
    return site.replace(/\/$/, '');
  }

  const envUrl = import.meta.env.PUBLIC_SITE_URL?.replace(/\/$/, '');
  return envUrl || siteConfig.url.replace(/\/$/, '');
}
