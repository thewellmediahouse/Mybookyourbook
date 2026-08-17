import type { DesignUploadKind } from '../../types/designStudio.ts';

/** Canonical upload limits — also re-exported via designStudioConfig.uploads. */
export const UPLOAD_LIMITS = {
  maxLogoFiles: 1,
  maxReferenceFiles: 10,
  maxImageBytes: 10 * 1024 * 1024,
  maxPdfBytes: 15 * 1024 * 1024,
  maxProjectBytes: 50 * 1024 * 1024,
  allowedImageMimeTypes: ['image/jpeg', 'image/png', 'image/webp'] as const,
  allowedDocumentMimeTypes: ['application/pdf'] as const,
};

export type UploadValidationInput = {
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  kind?: DesignUploadKind | 'document';
};

export type UploadValidationResult =
  | { ok: true; normalizedMime: string; extension: string }
  | { ok: false; error: string };

const IMAGE_MIME = new Set<string>(UPLOAD_LIMITS.allowedImageMimeTypes);
const DOC_MIME = new Set<string>(UPLOAD_LIMITS.allowedDocumentMimeTypes);

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'application/pdf': '.pdf',
};

export const UPLOAD_MUTABLE_STATUSES = new Set(['DRAFT', 'READY_TO_GENERATE']);

export function canMutateUploads(status: string): boolean {
  return UPLOAD_MUTABLE_STATUSES.has(status);
}

export function resolveUploadKind(
  value: string | null | undefined,
  filename: string,
): DesignUploadKind {
  const raw = (value || '').trim().toLowerCase();
  const allowed: DesignUploadKind[] = [
    'logo',
    'brand_guide',
    'product_photo',
    'team_photo',
    'reference',
    'other',
  ];
  if (allowed.includes(raw as DesignUploadKind)) {
    return raw as DesignUploadKind;
  }

  const lower = filename.toLowerCase();
  if (lower.includes('logo')) return 'logo';
  if (lower.endsWith('.pdf') || lower.includes('brand')) return 'brand_guide';
  if (lower.includes('team')) return 'team_photo';
  if (lower.includes('product')) return 'product_photo';
  return 'reference';
}

/** Best-effort magic-byte sniff; falls back to claimed type when unsure. */
export function sniffMimeType(bytes: Uint8Array, claimedMime: string): string | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  if (
    bytes.length >= 5 &&
    bytes[0] === 0x25 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x44 &&
    bytes[3] === 0x46
  ) {
    return 'application/pdf';
  }

  const claimed = claimedMime.toLowerCase().split(';')[0]?.trim() || '';
  if (IMAGE_MIME.has(claimed) || DOC_MIME.has(claimed)) {
    return claimed;
  }
  return null;
}

/**
 * Shared upload constraint checks (MIME, extension, size).
 */
export function validateUploadConstraints(
  input: UploadValidationInput,
): UploadValidationResult {
  const { mimeType, sizeBytes, originalFilename, kind = 'reference' } = input;
  const ext = originalFilename.includes('.')
    ? originalFilename.slice(originalFilename.lastIndexOf('.')).toLowerCase()
    : '';

  const allowedExt = new Set(['.jpg', '.jpeg', '.png', '.webp', '.pdf']);
  if (!allowedExt.has(ext)) {
    return { ok: false, error: 'File extension is not allowed.' };
  }

  const normalizedMime = mimeType.toLowerCase().split(';')[0]?.trim() || '';
  const isPdf = normalizedMime === 'application/pdf' || ext === '.pdf';

  if (isPdf) {
    if (!DOC_MIME.has(normalizedMime)) {
      return { ok: false, error: 'PDF uploads must use application/pdf.' };
    }
    if (kind === 'logo') {
      return { ok: false, error: 'Logo must be an image file, not a PDF.' };
    }
    if (sizeBytes > UPLOAD_LIMITS.maxPdfBytes) {
      return { ok: false, error: 'PDF exceeds the maximum size of 15 MB.' };
    }
    return { ok: true, normalizedMime: 'application/pdf', extension: '.pdf' };
  }

  if (!IMAGE_MIME.has(normalizedMime)) {
    return { ok: false, error: 'Image type must be JPEG, PNG, or WebP.' };
  }

  if (sizeBytes > UPLOAD_LIMITS.maxImageBytes) {
    return { ok: false, error: 'Image exceeds the maximum size of 10 MB.' };
  }

  return {
    ok: true,
    normalizedMime,
    extension: EXT_BY_MIME[normalizedMime] || ext.replace('.jpeg', '.jpg'),
  };
}

/** Generate a safe object basename — never trust the raw filename. */
export function sanitizeUploadBasename(extension: string): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let id = '';
  for (const byte of bytes) {
    id += byte!.toString(16).padStart(2, '0');
  }
  const safeExt = extension.startsWith('.') ? extension.toLowerCase() : `.${extension}`;
  return `upload-${id}${safeExt}`;
}

export function buildUploadObjectKey(projectId: string, safeFilename: string): string {
  return `design-studio/${projectId}/uploads/${safeFilename}`;
}

export function truncateOriginalFilename(name: string, max = 180): string {
  const trimmed = name.trim().slice(0, max);
  return trimmed || 'upload';
}
