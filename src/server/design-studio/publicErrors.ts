import type { OpenAIImageError } from '../../ai/design-studio/openaiImage.ts';
import type { OpenAITextError } from '../../ai/design-studio/openaiText.ts';

/** Map provider errors to safe, user-facing copy (no upstream details). */
export function publicOpenAiErrorMessage(
  error: OpenAITextError | OpenAIImageError,
): string {
  switch (error.code) {
    case 'openai_not_configured':
      return 'AI generation is not configured yet.';
    case 'openai_model_missing':
      return 'AI model is not configured yet.';
    case 'openai_timeout':
      return 'The AI request timed out. Please try again.';
    case 'openai_unreachable':
      return 'Unable to reach the AI service. Please try again.';
    case 'openai_quota_exceeded':
      return 'OpenAI billing/quota is exhausted. Add credits or upgrade the plan at platform.openai.com, then try again.';
    default:
      return 'AI generation failed. Please try again shortly.';
  }
}
