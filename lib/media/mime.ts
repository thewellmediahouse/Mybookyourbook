import type { LibraryRole } from "@/lib/r2/keys";

export const LIBRARY_MAX_BYTES = 8 * 1024 * 1024;
export const LIBRARY_LOGO_SVG_MAX_BYTES = 5 * 1024 * 1024;

export function normalizeLibraryMime(value: string, role: LibraryRole): string | null {
  const mime = value.trim().toLowerCase().split(";")[0]?.trim() ?? "";
  const mapped = mime === "image/jpg" ? "image/jpeg" : mime;
  if (mapped === "image/png" || mapped === "image/jpeg" || mapped === "image/webp") {
    return mapped;
  }
  if (role === "logo" && mapped === "image/svg+xml") {
    return mapped;
  }
  return null;
}

export function libraryMaxBytes(mimeType: string): number {
  return mimeType === "image/svg+xml" ? LIBRARY_LOGO_SVG_MAX_BYTES : LIBRARY_MAX_BYTES;
}

export function libraryAcceptAttribute(role: LibraryRole): string {
  if (role === "logo") {
    return "image/png,image/jpeg,image/webp,image/svg+xml,.png,.jpg,.jpeg,.webp,.svg";
  }
  return "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
}

export function libraryTooLargeMessage(mimeType: string): string {
  return mimeType === "image/svg+xml"
    ? "That logo is too large. Keep it under 5 MB."
    : "That photo is too large. Keep it under 8 MB.";
}
