export const LOGO_MAX_BYTES = 5 * 1024 * 1024;
export const LOGO_FORMAT_ERROR = "Use a PNG, JPEG, or WebP logo.";

const ALLOWED: Record<string, true> = {
  "image/png": true,
  "image/jpeg": true,
  "image/webp": true,
};

export function normalizeLogoMime(value: string): string | null {
  const mime = value.trim().toLowerCase();
  if (mime === "image/jpg") {
    return "image/jpeg";
  }
  return ALLOWED[mime] ? mime : null;
}

export function isAllowedLogoMime(value: string): boolean {
  return normalizeLogoMime(value) !== null;
}

export function logoAcceptAttribute(): string {
  return "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
}
