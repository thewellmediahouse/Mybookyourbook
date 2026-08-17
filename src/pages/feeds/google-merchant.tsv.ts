import type { APIRoute } from 'astro';
import { buildMerchantFeedTsv } from '@/utils/merchantFeed';

/** Static TSV product feed for Google Merchant Center scheduled fetch. */
export const GET: APIRoute = ({ site }) => {
  const body = buildMerchantFeedTsv(site);

  return new Response(body, {
    headers: {
      'Content-Type': 'text/tab-separated-values; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};
