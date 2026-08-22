import { isLogoPosition, type LogoPosition } from "@/lib/businesses/fields";

export function cleanBrandField(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/** Only structured profile values. Never invent a CTA, phone, WhatsApp, or website. */
export function brandingTextLines(input: {
  ctaValue?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
}): string[] {
  return [input.ctaValue, input.phone, input.whatsapp, input.website]
    .map((value) => cleanBrandField(value))
    .filter((value): value is string => Boolean(value));
}

export function shouldIncludeEndCard(lines: string[]): boolean {
  return lines.length > 0;
}

export function resolveLogoPosition(value: string | null | undefined): LogoPosition {
  const trimmed = value?.trim() ?? "";
  if (isLogoPosition(trimmed)) {
    return trimmed;
  }
  return "bottom-right";
}

export function overlayLogoPosition(
  position: LogoPosition,
  hasLogo: boolean,
): LogoPosition {
  if (!hasLogo || position === "none") {
    return "none";
  }
  return position;
}
