import { timingSafeEqual } from '../../utils/design-studio/accessToken.ts';
import type { DesignStudioEnv } from './types.ts';

/**
 * Team / internal Design Studio access.
 * Prefer Cloudflare Access in front of /design-your-website/internal* and
 * /api/design-studio/internal/* in production. Auth requires the shared team
 * service token — spoofable Access email headers alone are never enough.
 */
export function extractTeamToken(request: Request): string | null {
  const header = request.headers.get('x-design-studio-team-token');
  if (header?.trim()) return header.trim();

  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    return token || null;
  }

  return null;
}

export function authorizeTeamAccess(
  env: DesignStudioEnv,
  request: Request,
): { ok: true } | { ok: false; code: string; message: string } {
  const expected = (env.DESIGN_STUDIO_TEAM_TOKEN || '').trim();
  if (!expected) {
    return {
      ok: false,
      code: 'team_auth_not_configured',
      message: 'Design Studio team access is not configured.',
    };
  }

  const provided = extractTeamToken(request);
  if (!provided || !timingSafeEqual(provided, expected)) {
    return {
      ok: false,
      code: 'team_unauthorized',
      message: 'Valid team credentials are required.',
    };
  }

  return { ok: true };
}
