export const LOGO_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED: Record<string, true> = {
  "image/png": true,
  "image/jpeg": true,
  "image/webp": true,
  "image/svg+xml": true,
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
  return "image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg";
}
