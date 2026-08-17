/**
 * OpenAI Images helper for Cloudflare Workers (fetch-based).
 * Model name comes from OPENAI_IMAGE_MODEL — never hardcode in call sites.
 */

export type OpenAIImageResult = {
  bytes: Uint8Array;
  mimeType: string;
  model: string;
  usedReferenceImages: boolean;
};

export type OpenAIReferenceImage = {
  bytes: Uint8Array;
  mimeType: string;
  filename: string;
};

export class OpenAIImageError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 502, code = 'openai_image_error') {
    super(message);
    this.name = 'OpenAIImageError';
    this.status = status;
    this.code = code;
  }
}

function sniffImageMime(bytes: Uint8Array): string {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  return 'image/png';
}

function decodeB64Json(payload: unknown): Uint8Array {
  const data = payload as {
    error?: { message?: string };
    data?: Array<{ b64_json?: string; url?: string }>;
    model?: string;
  };

  const b64 = data.data?.[0]?.b64_json;
  if (!b64) {
    throw new OpenAIImageError('OpenAI returned no image data.', 502, 'openai_image_empty');
  }

  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function parseImageResponse(
  response: Response,
  fallbackModel: string,
): Promise<{ bytes: Uint8Array; mimeType: string; model: string }> {
  const raw = await response.text();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new OpenAIImageError('OpenAI returned an unreadable image response.', 502, 'openai_bad_response');
  }

  if (!response.ok) {
    const err = (data as { error?: { message?: string; code?: string } })?.error;
    const message = err?.message || 'OpenAI image request failed.';
    if (
      response.status === 429 ||
      err?.code === 'insufficient_quota' ||
      /exceeded your current quota/i.test(message)
    ) {
      throw new OpenAIImageError(message, 429, 'openai_quota_exceeded');
    }
    throw new OpenAIImageError(
      message,
      response.status >= 500 ? 502 : 400,
      'openai_image_request_failed',
    );
  }

  const bytes = decodeB64Json(data);
  return {
    bytes,
    mimeType: sniffImageMime(bytes),
    model: (data as { model?: string }).model || fallbackModel,
  };
}

/**
 * Portrait homepage mockup size (matches results card framing).
 * gpt-image-2: low quality keeps generation fast; 1024x1536 reads as a long-scroll site.
 */
export const CONCEPT_IMAGE_SIZE = '1024x1536';
export const CONCEPT_IMAGE_QUALITY = 'low';

/**
 * Text-only image generation (no reference uploads).
 */
export async function createImageGeneration(input: {
  apiKey: string;
  model: string;
  prompt: string;
  size?: string;
  quality?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<OpenAIImageResult> {
  const apiKey = input.apiKey.trim();
  const model = input.model.trim();

  if (!apiKey) {
    throw new OpenAIImageError('OpenAI is not configured.', 503, 'openai_not_configured');
  }
  if (!model) {
    throw new OpenAIImageError('OpenAI image model is not configured.', 503, 'openai_model_missing');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 120_000);
  const fetchFn = input.fetchImpl ?? fetch;

  try {
    const response = await fetchFn('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model,
        prompt: input.prompt,
        n: 1,
        size: input.size ?? CONCEPT_IMAGE_SIZE,
        quality: input.quality ?? CONCEPT_IMAGE_QUALITY,
      }),
    });

    const parsed = await parseImageResponse(response, model);
    return { ...parsed, usedReferenceImages: false };
  } catch (error) {
    if (error instanceof OpenAIImageError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OpenAIImageError('OpenAI image request timed out.', 504, 'openai_timeout');
    }
    throw new OpenAIImageError('Unable to reach OpenAI images API.', 502, 'openai_unreachable');
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Image edits / reference-guided generation when uploads are available.
 * Falls back to text-only generation when the edits endpoint rejects the request.
 */
export async function createConceptImage(input: {
  apiKey: string;
  model: string;
  prompt: string;
  referenceImages?: OpenAIReferenceImage[];
  /** Prefer text-only generation (faster). Default true for concept cards. */
  preferTextOnly?: boolean;
  size?: string;
  quality?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<OpenAIImageResult> {
  const preferTextOnly = input.preferTextOnly !== false;
  const refs = preferTextOnly ? [] : (input.referenceImages || []).slice(0, 3);
  if (refs.length === 0) {
    return createImageGeneration(input);
  }

  const apiKey = input.apiKey.trim();
  const model = input.model.trim();
  if (!apiKey) {
    throw new OpenAIImageError('OpenAI is not configured.', 503, 'openai_not_configured');
  }
  if (!model) {
    throw new OpenAIImageError('OpenAI image model is not configured.', 503, 'openai_model_missing');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 120_000);
  const fetchFn = input.fetchImpl ?? fetch;

  try {
    const form = new FormData();
    form.set('model', model);
    form.set('prompt', input.prompt);
    form.set('n', '1');
    form.set('size', input.size ?? CONCEPT_IMAGE_SIZE);
    form.set('quality', input.quality ?? CONCEPT_IMAGE_QUALITY);

    for (const ref of refs) {
      const copy = new Uint8Array(ref.bytes);
      const blob = new Blob([copy], { type: ref.mimeType });
      form.append('image[]', blob, ref.filename);
    }

    const response = await fetchFn('https://api.openai.com/v1/images/edits', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
      },
      body: form,
    });

    const parsed = await parseImageResponse(response, model);
    return { ...parsed, usedReferenceImages: true };
  } catch (error) {
    // Graceful fallback: logo/reference input unavailable or rejected by the endpoint.
    if (error instanceof OpenAIImageError && error.code === 'openai_image_request_failed') {
      return createImageGeneration(input);
    }
    if (error instanceof OpenAIImageError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OpenAIImageError('OpenAI image request timed out.', 504, 'openai_timeout');
    }
    // Network / unexpected edit failures → try plain generation once.
    return createImageGeneration(input);
  } finally {
    clearTimeout(timeout);
  }
}
