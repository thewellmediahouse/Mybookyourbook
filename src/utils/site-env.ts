/** Deploy / build environment for public site behavior (Pages env vars). */
export type SiteEnv = 'production' | 'preview' | 'development';

export function getSiteEnv(): SiteEnv {
  const raw = String(import.meta.env.PUBLIC_SITE_ENV ?? '')
    .trim()
    .toLowerCase();

  if (raw === 'preview') return 'preview';
  if (raw === 'development') return 'development';
  if (import.meta.env.DEV) return 'development';
  return 'production';
}

/** Well Media staging hosts set PUBLIC_SITE_ENV=preview on Pages. */
export function isPreviewSite(): boolean {
  return getSiteEnv() === 'preview';
}
