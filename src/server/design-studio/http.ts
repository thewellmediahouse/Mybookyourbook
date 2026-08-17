const DEFAULT_HEADERS = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
};

export function jsonResponse(
  data: unknown,
  status = 200,
  init: ResponseInit = {},
): Response {
  return new Response(JSON.stringify(data), {
    status,
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init.headers ?? {}),
    },
  });
}

export function errorResponse(
  status: number,
  code: string,
  message: string,
): Response {
  return jsonResponse({ error: { code, message } }, status);
}

export async function readJsonBody<T = unknown>(
  request: Request,
  maxBytes = 64_000,
): Promise<{ ok: true; value: T } | { ok: false; response: Response }> {
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > maxBytes) {
    return {
      ok: false,
      response: errorResponse(413, 'payload_too_large', 'Request body is too large.'),
    };
  }

  try {
    const text = await request.text();
    if (text.length > maxBytes) {
      return {
        ok: false,
        response: errorResponse(413, 'payload_too_large', 'Request body is too large.'),
      };
    }
    if (!text.trim()) {
      return { ok: true, value: {} as T };
    }
    return { ok: true, value: JSON.parse(text) as T };
  } catch {
    return {
      ok: false,
      response: errorResponse(400, 'invalid_json', 'Request body must be valid JSON.'),
    };
  }
}

export function extractAccessToken(request: Request): string | null {
  const headerToken = request.headers.get('x-design-studio-token');
  if (headerToken?.trim()) return headerToken.trim();

  const auth = request.headers.get('authorization');
  if (auth?.toLowerCase().startsWith('bearer ')) {
    const token = auth.slice(7).trim();
    return token || null;
  }

  return null;
}

export function methodNotAllowed(allowed: string[]): Response {
  return errorResponse(405, 'method_not_allowed', `Allowed: ${allowed.join(', ')}`);
}
