import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildUploadObjectKey,
  canMutateUploads,
  resolveUploadKind,
  sanitizeUploadBasename,
  sniffMimeType,
  validateUploadConstraints,
} from '../../src/utils/design-studio/uploads.ts';

describe('upload validation', () => {
  it('accepts jpeg/png/webp/pdf within size limits', () => {
    const jpeg = validateUploadConstraints({
      mimeType: 'image/jpeg',
      sizeBytes: 1024,
      originalFilename: 'logo.jpg',
      kind: 'logo',
    });
    assert.equal(jpeg.ok, true);

    const pdf = validateUploadConstraints({
      mimeType: 'application/pdf',
      sizeBytes: 1024,
      originalFilename: 'brand.pdf',
      kind: 'brand_guide',
    });
    assert.equal(pdf.ok, true);
  });

  it('rejects disallowed types, oversized files, and pdf logos', () => {
    const zip = validateUploadConstraints({
      mimeType: 'application/zip',
      sizeBytes: 10,
      originalFilename: 'x.zip',
    });
    assert.equal(zip.ok, false);

    const huge = validateUploadConstraints({
      mimeType: 'image/png',
      sizeBytes: 11 * 1024 * 1024,
      originalFilename: 'big.png',
    });
    assert.equal(huge.ok, false);

    const pdfLogo = validateUploadConstraints({
      mimeType: 'application/pdf',
      sizeBytes: 100,
      originalFilename: 'logo.pdf',
      kind: 'logo',
    });
    assert.equal(pdfLogo.ok, false);
  });

  it('sniffs magic bytes for common formats', () => {
    assert.equal(sniffMimeType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]), ''), 'image/jpeg');
    assert.equal(
      sniffMimeType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ''),
      'image/png',
    );
    assert.equal(
      sniffMimeType(new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]), ''),
      'application/pdf',
    );
  });

  it('builds private object keys and safe basenames', () => {
    const base = sanitizeUploadBasename('.png');
    assert.match(base, /^upload-[a-f0-9]+\.png$/);
    assert.equal(
      buildUploadObjectKey('proj-1', base),
      `design-studio/proj-1/uploads/${base}`,
    );
  });

  it('resolves kinds and mutation windows', () => {
    assert.equal(resolveUploadKind('logo', 'x.png'), 'logo');
    assert.equal(resolveUploadKind(null, 'brand-guide.pdf'), 'brand_guide');
    assert.equal(canMutateUploads('DRAFT'), true);
    assert.equal(canMutateUploads('GENERATING'), false);
  });
});
