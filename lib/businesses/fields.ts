export const LOGO_POSITIONS = [
  "none",
  "bottom-right",
  "bottom-left",
  "top-right",
  "top-left",
] as const;

export const LOGO_POSITION_LABELS: Record<(typeof LOGO_POSITIONS)[number], string> = {
  none: "No logo",
  "bottom-right": "Bottom right",
  "bottom-left": "Bottom left",
  "top-right": "Top right",
  "top-left": "Top left",
};

export type LogoPosition = (typeof LOGO_POSITIONS)[number];

export function isLogoPosition(value: string): value is LogoPosition {
  return (LOGO_POSITIONS as readonly string[]).includes(value);
}

export function emptyToNull(value: string | undefined | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function parseBrandHex(value: string, field: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    throw new Error(`${field} must look like #1678FF, or be left blank.`);
  }
  return trimmed;
}

export type BrandInput = {
  name: string;
  website?: string;
  industry?: string;
  country?: string;
  city?: string;
  description?: string;
  tagline?: string;
  phone?: string;
  email?: string;
  whatsapp?: string;
  primaryColor?: string;
  secondaryColor?: string;
  defaultCta?: string;
  defaultLogoPosition?: string;
  timezone?: string;
};
