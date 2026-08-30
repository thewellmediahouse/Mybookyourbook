/** Filming cannot spell. Any letters in the take become unreadable marks. */

export const PLAIN_SURFACES =
  "Plain surfaces only. No writing, letters, numbers, logos, buttons, or call-to-action graphics.";

export const NO_GENERATED_TEXT_INSTRUCTION =
  "Never generate any written characters — not large, not small, not decorative, not blurry, not in the background, and not as a call to action. No subtitles, captions, lower thirds, end cards, logos, prices, phone numbers, websites, labels, signs, buttons, interface text, banners, watermarks, posters, menus, packaging type, or handwritten notes. The camera cannot spell. Small writing and small call-to-action graphics become unreadable marks. The presenter speaks the call to action. Branding and exact written information are added later, never filmed.";

export const BACKGROUND_SIGNAGE_INSTRUCTION =
  "If a wall, window, screen, product, street, or shopfront would normally show writing, keep it blank, turned away, covered, or fully out of focus so no letters can be read or guessed.";

export const NO_SMALL_CTA_INSTRUCTION =
  "Do not film a small call to action, a tiny button, a badge, a lower-third, a title card, or any graphic with words. A call to action is spoken only.";

export const SCENE_NO_WRITING_LINE =
  "Written text in this shot: none. No letters, numbers, logos, buttons, captions, or call-to-action graphics.";

const ON_SCREEN_WRITING = [
  /\b(subtitles?|captions?|lower[- ]thirds?|end[- ]cards?|title cards?|watermarks?)\b/i,
  /\btext overlays?\b/i,
  /\bon[- ]screen\b.{0,48}\b(text|words|type|copy|cta|button|graphic|title|cta)\b/i,
  /\b(small|tiny|fine|micro)\b.{0,24}\b(text|type|print|letters|writing|cta|call[- ]to[- ]action)\b/i,
  /\b(call[- ]to[- ]action|cta)\b.{0,48}\b(button|graphic|card|text|overlay|on[- ]screen|badge|sticker)\b/i,
  /\b(sign|poster|banner|chalkboard|whiteboard|sandwich board)\b.{0,72}\b(say|says|saying|read|reads|reading|words|text|lettering)\b/i,
  /\b(words|text|lettering|typography|writing)\b.{0,24}\b(on|across|over)\b/i,
  /\b(show|display|reveal)\b.{0,36}\b(phone number|website|url|price|email|whatsapp|qr code)\b/i,
  /\b(handwritten|hand-written)\b.{0,24}\b(sign|note|board|cta|text|words)\b/i,
  /\b(readable|legible)\b.{0,24}\b(text|sign|type|words|letters)\b/i,
  /\bgraphic\b.{0,24}\b(saying|that says|with the words)\b/i,
  /\bbutton\b.{0,36}\b(saying|labeled|that says|book now|call now|shop now)\b/i,
];

export function looksLikeOnScreenWriting(text: string): boolean {
  const value = text.trim();
  if (!value) {
    return false;
  }
  return ON_SCREEN_WRITING.some((pattern) => pattern.test(value));
}

export function neutralizeOnScreenWriting(text: string): string {
  const value = text.trim();
  if (!value) {
    return value;
  }
  const parts = value.split(/(?<=[.!?])\s+/);
  const cleaned = parts.map((part) => (looksLikeOnScreenWriting(part) ? PLAIN_SURFACES : part));
  const unique: string[] = [];
  for (const part of cleaned) {
    if (part === PLAIN_SURFACES && unique[unique.length - 1] === PLAIN_SURFACES) {
      continue;
    }
    unique.push(part);
  }
  return unique.join(" ").trim();
}

export function sanitizeFilmedSceneFields<
  T extends {
    visual: string;
    presenterAction: string | null;
    camera: string;
    audio: string | null;
  },
>(scene: T): T {
  return {
    ...scene,
    visual: neutralizeOnScreenWriting(scene.visual) || PLAIN_SURFACES,
    presenterAction: scene.presenterAction
      ? neutralizeOnScreenWriting(scene.presenterAction)
      : scene.presenterAction,
    camera: neutralizeOnScreenWriting(scene.camera) || scene.camera,
    audio: scene.audio ? neutralizeOnScreenWriting(scene.audio) : scene.audio,
  };
}

export function ensureFilmingTextBan(prompt: string): string {
  const missing = [
    NO_GENERATED_TEXT_INSTRUCTION,
    BACKGROUND_SIGNAGE_INSTRUCTION,
    NO_SMALL_CTA_INSTRUCTION,
  ].filter((line) => !prompt.includes(line));
  if (missing.length === 0) {
    return prompt.trim();
  }
  return [prompt.trim(), "", ...missing].join("\n").trim();
}
