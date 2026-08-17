export type TurnstileVerifyResult =
  | { ok: true; hostname?: string }
  | { ok: false; code: string; message: string };

type TurnstileApiResponse = {
  success?: boolean;
  'error-codes'?: string[];
  hostname?: string;
  action?: string;
  cdata?: string;
};

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

const ERROR_MESSAGES: Record<string, string> = {
  missing_input_secret: 'Security check is not configured. Please try again later.',
  invalid_input_secret: 'Security check is not configured correctly.',
  missing_input_response: 'Please complete the security check before generating.',
  invalid_input_response: 'Security check failed. Please try again.',
  bad_request: 'Security check request was invalid. Please try again.',
  timeout_or_duplicate: 'Security check expired. Please complete it again.',
  internal_error: 'Security check is temporarily unavailable. Please try again.',
};

export function mapTurnstileErrorCodes(codes: string[] | undefined): {
  code: string;
  message: string;
} {
  const first = codes?.[0] || 'invalid_input_response';
  return {
    code: first,
    message: ERROR_MESSAGES[first] || 'Security check failed. Please try again.',
  };
}

/**
 * Verify a Turnstile response token with Cloudflare (server-side only).
 */
export async function verifyTurnstileToken(input: {
  secret: string;
  token: string;
  remoteIp?: string | null;
  fetchImpl?: typeof fetch;
}): Promise<TurnstileVerifyResult> {
  const secret = input.secret.trim();
  const token = input.token.trim();

  if (!secret) {
    return {
      ok: false,
      code: 'turnstile_not_configured',
      message: 'Security check is not configured. Please try again later.',
    };
  }

  if (!token) {
    return {
      ok: false,
      code: 'missing_turnstile_token',
      message: 'Please complete the security check before generating.',
    };
  }

  const body = new URLSearchParams();
  body.set('secret', secret);
  body.set('response', token);
  if (input.remoteIp) {
    body.set('remoteip', input.remoteIp);
  }

  const fetchFn = input.fetchImpl ?? fetch;

  try {
    const response = await fetchFn(TURNSTILE_VERIFY_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });

    if (!response.ok) {
      return {
        ok: false,
        code: 'turnstile_unavailable',
        message: 'Security check is temporarily unavailable. Please try again.',
      };
    }

    const data = (await response.json()) as TurnstileApiResponse;
    if (!data.success) {
      const mapped = mapTurnstileErrorCodes(data['error-codes']);
      return { ok: false, code: mapped.code, message: mapped.message };
    }

    return { ok: true, hostname: data.hostname };
  } catch {
    return {
      ok: false,
      code: 'turnstile_unavailable',
      message: 'Security check is temporarily unavailable. Please try again.',
    };
  }
}
