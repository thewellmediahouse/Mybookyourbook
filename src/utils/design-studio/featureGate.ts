import { designStudioConfig } from '@/config/designStudio';

/**
 * When Design Studio is disabled, Astro pages should return this so the route
 * is not published. Flip `designStudioConfig.enabled` to restore.
 */
export function designStudioNotFoundIfDisabled(): Response | undefined {
  if (designStudioConfig.enabled) return undefined;
  return new Response(null, {
    status: 404,
    statusText: 'Not Found',
  });
}

/** API/Worker gate — same flag as pages. */
export function designStudioApiDisabledResponse(): Response | null {
  if (designStudioConfig.enabled) return null;
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
