import type { LibraryRole } from "@/lib/r2/keys";
import { LOGO_FORMAT_ERROR } from "@/lib/r2/mime";

export const LIBRARY_MAX_BYTES = 8 * 1024 * 1024;

export function normalizeLibraryMime(value: string, role: LibraryRole): string | null {
  const mime = value.trim().toLowerCase().split(";")[0]?.trim() ?? "";
  const mapped = mime === "image/jpg" ? "image/jpeg" : mime;
  if (mapped === "image/png" || mapped === "image/jpeg" || mapped === "image/webp") {
    return mapped;
  }
  return null;
}

export function libraryMaxBytes(_mimeType: string): number {
  return LIBRARY_MAX_BYTES;
}

export function libraryAcceptAttribute(_role: LibraryRole): string {
  return "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
}

export function libraryTooLargeMessage(_mimeType: string): string {
  return "That photo is too large. Keep it under 8 MB.";
}

export function libraryFormatError(role: LibraryRole): string {
  return role === "logo" ? LOGO_FORMAT_ERROR : "Use a PNG, JPEG, or WebP photo.";
}
