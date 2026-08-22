export function normalizeIdentityPhotoMime(value: string): string | null {
  const mime = value.trim().toLowerCase();
  const mapped = mime === "image/jpg" ? "image/jpeg" : mime;
  if (mapped === "image/png" || mapped === "image/jpeg" || mapped === "image/webp") {
    return mapped;
  }
  return null;
}

export function normalizeIdentityVideoMime(value: string): string | null {
  const mime = value.trim().toLowerCase().split(";")[0]?.trim() ?? "";
  if (
    mime === "video/mp4" ||
    mime === "video/webm" ||
    mime === "video/quicktime" ||
    mime === "video/x-m4v"
  ) {
    return mime;
  }
  return null;
}

export function identityPhotoAccept(): string {
  return "image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp";
}

export function identityVideoAccept(): string {
  return "video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v";
}
