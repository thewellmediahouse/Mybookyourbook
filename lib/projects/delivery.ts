import type { AdStyle, AspectRatio } from "./brief";

export const NEW_ASPECT_RATIO_NOTICE =
  "A new aspect ratio requires a new AI production and uses 1 Ad Credit.";
export const VERSION_CREDIT_NOTICE =
  "Creating a concept is free. Producing this commercial uses 1 Ad Credit.";
export const CREATE_VARIATION = "Create Variation";
export const DUPLICATE = "Duplicate";
export const CREATE_VERTICAL = "Create Vertical Version";
export const CREATE_LANDSCAPE = "Create Landscape Version";
export const CREATE_ANOTHER_VERSION = "Create Another Version";
export const ALREADY_VERTICAL = `This commercial is already vertical. ${NEW_ASPECT_RATIO_NOTICE}`;
export const ALREADY_LANDSCAPE = `This commercial is already landscape. ${NEW_ASPECT_RATIO_NOTICE}`;
export const IN_PRODUCTION_LOCK =
  "Wait until production finishes before changing this commercial.";
export const ARCHIVE = "Archive";
export const DELETE = "Delete";
export const DELETE_PERMANENT_WARNING =
  "This commercial will be permanently deleted. You cannot get it back.";
export const DELETE_PERMANENT_CONFIRM = "Delete permanently";
export const KEEP_VIDEO = "Keep video";
export const RENAME = "Rename";
export const ARCHIVE_ONLY_FINISHED = "Archive is for finished commercials.";
export const ALREADY_ARCHIVED = "This commercial is already archived.";

export const VARIATION_OPTIONS = [
  { id: "funnier", label: "Funnier", style: "Funny" },
  { id: "professional", label: "More Professional", style: "Professional" },
  { id: "luxurious", label: "More Luxurious", style: "Luxury" },
  { id: "sales-hook", label: "Stronger Sales Hook" },
  { id: "emotional", label: "More Emotional", style: "Emotional" },
  { id: "environment", label: "Different Environment" },
  { id: "opening", label: "New Opening" },
  { id: "custom", label: "Custom Change" },
] as const;

export type VariationOptionId = (typeof VARIATION_OPTIONS)[number]["id"];
export type FormatVersionRatio = Extract<AspectRatio, "9:16" | "16:9">;

export function isVariationOptionId(value: string): value is VariationOptionId {
  return VARIATION_OPTIONS.some((option) => option.id === value);
}

export function alreadyThisFormatMessage(ratio: FormatVersionRatio): string {
  return ratio === "9:16" ? ALREADY_VERTICAL : ALREADY_LANDSCAPE;
}

export function assertNewAspectRatio(current: string | null, next: FormatVersionRatio): void {
  if (current === next) {
    throw new Error(alreadyThisFormatMessage(next));
  }
}

export function withTitleSuffix(title: string, suffix: string): string {
  const base = title.trim() || "Untitled commercial";
  const tagged = ` (${suffix})`;
  if (base.endsWith(tagged)) {
    return base;
  }
  return `${base}${tagged}`;
}

export function variationStyle(optionId: VariationOptionId): AdStyle | undefined {
  const option = VARIATION_OPTIONS.find((item) => item.id === optionId);
  return option && "style" in option ? (option.style as AdStyle) : undefined;
}
