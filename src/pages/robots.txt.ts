import type { APIRoute } from 'astro';
import { getSiteUrl } from '@/utils/site-url';

export const GET: APIRoute = ({ site }) => {
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
