import type { APIRoute } from 'astro';
import { isPreviewSite } from '@/utils/site-env';
import { getSiteUrl } from '@/utils/site-url';

export const GET: APIRoute = ({ site }) => {
  if (isPreviewSite()) {
    const body = `User-agent: *
Disallow: /
`;
    return new Response(body, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const siteUrl = getSiteUrl(site);
  const sitemapUrl = new URL('/sitemap-index.xml', `${siteUrl}/`).href;
  const body = `User-agent: *
Allow: /

Sitemap: ${sitemapUrl}
`;

  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
