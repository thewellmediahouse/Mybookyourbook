/**
 * Cloudflare Worker entry — static Astro assets + Design Studio APIs.
 * Marketing pages remain static files in dist/; only /api/design-studio/* is dynamic.
 */
import { designStudioConfig } from '@/config/designStudio';
import { routeDesignStudioApi } from '@/server/design-studio/router';
import type { DesignStudioEnv } from '@/server/design-studio/types';

function isDynamicResultsPath(pathname: string): boolean {
  // Serve the static results shell for /design-your-website/results/:id
  // while keeping /results/demo and /results/ as real static pages.
  const match = pathname.match(/^\/design-your-website\/results\/([^/]+)\/?$/);
  if (!match?.[1]) return false;
  return match[1] !== 'demo';
}

export default {
  async fetch(
    request: Request,
    env: DesignStudioEnv,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    const studioEnabled = designStudioConfig.enabled;

    if (url.pathname.startsWith('/api/design-studio')) {
      if (!studioEnabled) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'not_found',
              message: 'Design Studio is not available.',
            },
          }),
          {
            status: 404,
            headers: { 'content-type': 'application/json; charset=utf-8' },
          },
        );
      }

      if (!env.DESIGN_STUDIO_DB) {
        return new Response(
          JSON.stringify({
            error: {
              code: 'db_unavailable',
              message: 'Design Studio database binding is not configured.',
            },
          }),
          {
            status: 503,
            headers: { 'content-type': 'application/json; charset=utf-8' },
          },
        );
      }

      return routeDesignStudioApi(request, env, url.pathname, ctx);
    }

    if (studioEnabled && isDynamicResultsPath(url.pathname)) {
      const shellUrl = new URL('/design-your-website/results/', request.url);
      return env.ASSETS.fetch(new Request(shellUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};
