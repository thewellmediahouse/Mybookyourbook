export const ADVERTISING_TYPES = [
  "Business",
  "Product",
  "Service",
  "Special offer",
  "Event",
  "Property",
  "Restaurant",
  "New location",
  "Lead generation",
  "Brand awareness",
  "Other",
] as const;

export const CTA_TYPES = [
  "Call",
  "WhatsApp",
  "Visit Website",
  "Book",
  "Buy",
  "Request Quote",
  "Visit Store",
  "Send Enquiry",
  "Learn More",
] as const;

export const AD_STYLES = [
  "Cinematic",
  "Luxury",
  "Professional",
  "High Energy",
  "Emotional",
  "Funny",
  "Social",
  "Corporate",
] as const;

export const TONE_OPTIONS = [
  "Confident",
  "Relaxed",
  "Warm",
  "Authoritative",
  "Energetic",
  "Sophisticated",
  "Friendly",
  "Serious",
  "Inspirational",
] as const;

export const PLATFORMS = [
  "Instagram/Facebook Reels",
  "TikTok",
  "YouTube",
  "Website",
  "Facebook Feed",
  "Instagram Feed",
  "LinkedIn",
  "Other",
] as const;

export const ASPECT_RATIOS = [
  { value: "9:16", label: "9:16 Vertical" },
  { value: "16:9", label: "16:9 Landscape" },
  { value: "1:1", label: "1:1 Square" },
] as const;

export const DURATIONS = [10, 15, 20, 30] as const;
export const DEFAULT_DURATION = 30;
export const DURATION_CHOICE = "Choose 10, 15, 20, or 30 seconds.";
export const CONTEXT_REFERENCE_LIMIT = 6;

export const CONTEXT_SLOTS = [
  "CONTEXT_1",
  "CONTEXT_2",
  "CONTEXT_3",
  "CONTEXT_4",
  "CONTEXT_5",
  "CONTEXT_6",
] as const;

export type AdvertisingType = (typeof ADVERTISING_TYPES)[number];
export type CtaType = (typeof CTA_TYPES)[number];
export type AdStyle = (typeof AD_STYLES)[number];
export type ToneOption = (typeof TONE_OPTIONS)[number];
export type PlatformOption = (typeof PLATFORMS)[number];
export type AspectRatio = (typeof ASPECT_RATIOS)[number]["value"];
export type ToneState = { tones: ToneOption[]; avoid: string };

export function isAdvertisingType(value: string): value is AdvertisingType {
  return (ADVERTISING_TYPES as readonly string[]).includes(value);
}

export function isCtaType(value: string): value is CtaType {
  return (CTA_TYPES as readonly string[]).includes(value);
}

export function isAdStyle(value: string): value is AdStyle {
  return (AD_STYLES as readonly string[]).includes(value);
}

export function isPlatformOption(value: string): value is PlatformOption {
  return (PLATFORMS as readonly string[]).includes(value);
}

export function isAspectRatio(value: string): value is AspectRatio {
  return ASPECT_RATIOS.some((item) => item.value === value);
}

export function isDuration(value: number): value is (typeof DURATIONS)[number] {
  return (DURATIONS as readonly number[]).includes(value);
}

export function parseToneJson(value: string | null | undefined): ToneState {
  if (!value) {
    return { tones: [], avoid: "" };
  }
  try {
    const parsed = JSON.parse(value) as { tones?: unknown; avoid?: unknown };
    const tones = Array.isArray(parsed.tones)
      ? parsed.tones.filter((item): item is ToneOption => typeof item === "string" && TONE_OPTIONS.includes(item as ToneOption))
      : [];
    const avoid = typeof parsed.avoid === "string" ? parsed.avoid : "";
    return { tones, avoid };
  } catch {
    return { tones: [], avoid: "" };
  }
}

export function serializeToneJson(input: ToneState): string {
  return JSON.stringify({ tones: input.tones, avoid: input.avoid.trim() });
}

export function recommendedAspectRatio(platform: string | null | undefined): AspectRatio | null {
  if (
    platform === "Instagram/Facebook Reels" ||
    platform === "TikTok"
  ) {
    return "9:16";
  }
  if (platform === "YouTube" || platform === "Website") {
    return "16:9";
  }
  if (
    platform === "Facebook Feed" ||
    platform === "Instagram Feed" ||
    platform === "LinkedIn"
  ) {
    return "1:1";
  }
  return null;
}

export function requireExplicitAspectRatio(value: string | null | undefined): AspectRatio {
  const trimmed = value?.trim() ?? "";
  if (!trimmed || trimmed.toLowerCase() === "auto" || trimmed.toLowerCase() === "automatic") {
    throw new Error("Choose 9:16, 16:9, or 1:1. We do not pick the shape for you.");
  }
  if (!isAspectRatio(trimmed)) {
    throw new Error("Choose 9:16, 16:9, or 1:1. We do not pick the shape for you.");
  }
  return trimmed;
}

export function nextContextSlot(used: string[]): (typeof CONTEXT_SLOTS)[number] | null {
  return CONTEXT_SLOTS.find((slot) => !used.includes(slot)) ?? null;
}

export function titleFromPrompt(prompt: string): string {
  const first = prompt.trim().split(/\n/)[0]?.trim() ?? "";
  if (!first) {
    return "";
  }
  return first.length > 72 ? `${first.slice(0, 72).trimEnd()}…` : first;
}
