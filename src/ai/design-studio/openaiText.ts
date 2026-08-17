/**
 * OpenAI Chat Completions helper for Cloudflare Workers (fetch-based).
 * Model name comes from OPENAI_TEXT_MODEL — never hardcode in call sites.
 */

export type OpenAITextMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type OpenAITextResult = {
  content: string;
  model: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

export class OpenAITextError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 502, code = 'openai_error') {
    super(message);
    this.name = 'OpenAITextError';
    this.status = status;
    this.code = code;
  }
}

export async function createChatCompletion(input: {
  apiKey: string;
  model: string;
  messages: OpenAITextMessage[];
  temperature?: number;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}): Promise<OpenAITextResult> {
  const apiKey = input.apiKey.trim();
  const model = input.model.trim();

  if (!apiKey) {
    throw new OpenAITextError('OpenAI is not configured.', 503, 'openai_not_configured');
  }
  if (!model) {
    throw new OpenAITextError('OpenAI text model is not configured.', 503, 'openai_model_missing');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), input.timeoutMs ?? 180_000);
  const fetchFn = input.fetchImpl ?? fetch;

  // GPT-5.x chat models only accept the default temperature (1). Omit the field.
  const supportsCustomTemperature = !/^gpt-5(\b|\.|-)/i.test(model);
  const requestBody: Record<string, unknown> = {
    model,
    response_format: { type: 'json_object' },
    messages: input.messages,
  };
  if (supportsCustomTemperature) {
    requestBody.temperature = input.temperature ?? 0.8;
  }

  try {
    const response = await fetchFn('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const raw = await response.text();
    let data: {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string } }>;
      model?: string;
      usage?: OpenAITextResult['usage'];
    };

    try {
      data = JSON.parse(raw) as typeof data;
    } catch {
      throw new OpenAITextError('OpenAI returned an unreadable response.', 502, 'openai_bad_response');
    }

    if (!response.ok) {
      const message = data.error?.message || 'OpenAI request failed.';
      const providerCode =
        typeof (data.error as { code?: unknown } | undefined)?.code === 'string'
          ? String((data.error as { code?: string }).code)
          : '';
      if (
        response.status === 429 ||
        providerCode === 'insufficient_quota' ||
        /exceeded your current quota/i.test(message)
      ) {
        throw new OpenAITextError(message, 429, 'openai_quota_exceeded');
      }
      throw new OpenAITextError(message, response.status >= 500 ? 502 : 400, 'openai_request_failed');
    }

    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) {
      throw new OpenAITextError('OpenAI returned empty content.', 502, 'openai_empty');
    }

    return {
      content,
      model: data.model || model,
      usage: data.usage,
    };
  } catch (error) {
    if (error instanceof OpenAITextError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new OpenAITextError('OpenAI request timed out.', 504, 'openai_timeout');
    }
    throw new OpenAITextError('Unable to reach OpenAI.', 502, 'openai_unreachable');
  } finally {
    clearTimeout(timeout);
  }
}
