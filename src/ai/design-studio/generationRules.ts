/**
 * Prompt version and assembled generation policy text.
 * Runtime-safe for Cloudflare Workers (no filesystem / ?raw imports).
 */
import { DESIGN_STUDIO_PROMPT_VERSION } from './promptVersion';
import {
  DESIGN_STUDIO_GENERATION_RULES_TEXT,
  PLATFORM_DESIGN_RULES_TEXT,
} from './rulesContent';

export { DESIGN_STUDIO_PROMPT_VERSION };

export const DESIGN_STUDIO_SYSTEM_PROMPT = [
  'You are a senior web design strategist creating website visual directions.',
  'Produce exactly four materially different directions.',
  'Follow the requested industry, goals, style, brand colours, functions, and pages.',
  'Prioritize conversion, clarity, accessibility, responsive design, and professional hierarchy.',
  'Never fabricate awards or unsupported claims.',
  'Never clone a named competitor pixel-for-pixel.',
  'Return valid structured JSON only.',
].join(' ');

export function getDesignStudioGenerationPolicy(): string {
  return [
    DESIGN_STUDIO_SYSTEM_PROMPT,
    '',
    '## Platform design rules',
    PLATFORM_DESIGN_RULES_TEXT.trim(),
    '',
    '## Design Studio generation rules',
    DESIGN_STUDIO_GENERATION_RULES_TEXT.trim(),
  ].join('\n');
}

export const designStudioGenerationRules = DESIGN_STUDIO_GENERATION_RULES_TEXT;
export const platformDesignRulesSnippet = PLATFORM_DESIGN_RULES_TEXT;
