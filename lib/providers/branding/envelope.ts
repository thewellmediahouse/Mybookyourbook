import type { BrandingMediaInfo } from "./types";

const MAGIC = new TextEncoder().encode("CYB1");

function readUint32(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset] ?? 0) << 24) |
    ((bytes[offset + 1] ?? 0) << 16) |
    ((bytes[offset + 2] ?? 0) << 8) |
    (bytes[offset + 3] ?? 0)
  ) >>> 0;
}

function writeUint32(value: number): Uint8Array {
  return Uint8Array.of((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);
}

export function encodeBrandingEnvelope(input: {
  meta: BrandingMediaInfo;
  thumbnailBytes: Uint8Array;
  videoBytes: Uint8Array;
}): Uint8Array {
  const metaBytes = new TextEncoder().encode(JSON.stringify(input.meta));
  const packed = new Uint8Array(
    MAGIC.byteLength + 4 + metaBytes.byteLength + 4 + input.thumbnailBytes.byteLength + input.videoBytes.byteLength,
  );
  let offset = 0;
  packed.set(MAGIC, offset);
  offset += MAGIC.byteLength;
  packed.set(writeUint32(metaBytes.byteLength), offset);
  offset += 4;
  packed.set(metaBytes, offset);
  offset += metaBytes.byteLength;
  packed.set(writeUint32(input.thumbnailBytes.byteLength), offset);
  offset += 4;
  packed.set(input.thumbnailBytes, offset);
  offset += input.thumbnailBytes.byteLength;
  packed.set(input.videoBytes, offset);
  return packed;
}

export function decodeBrandingEnvelope(bytes: Uint8Array): {
  meta: BrandingMediaInfo;
  thumbnailBytes: Uint8Array;
  videoBytes: Uint8Array;
} {
  if (bytes.byteLength < MAGIC.byteLength + 8) {
    throw new Error("BRANDING_ENVELOPE");
  }
  const magic = new TextDecoder().decode(bytes.subarray(0, MAGIC.byteLength));
  if (magic !== "CYB1") {
    throw new Error("BRANDING_ENVELOPE");
  }
  let offset = MAGIC.byteLength;
  const metaLen = readUint32(bytes, offset);
  offset += 4;
  const metaEnd = offset + metaLen;
  if (metaEnd + 4 > bytes.byteLength) {
    throw new Error("BRANDING_ENVELOPE");
  }
  const meta = JSON.parse(new TextDecoder().decode(bytes.subarray(offset, metaEnd))) as BrandingMediaInfo;
  offset = metaEnd;
  const thumbLen = readUint32(bytes, offset);
  offset += 4;
  const thumbEnd = offset + thumbLen;
  if (thumbEnd > bytes.byteLength) {
    throw new Error("BRANDING_ENVELOPE");
  }
  return {
    meta,
    thumbnailBytes: bytes.subarray(offset, thumbEnd),
    videoBytes: bytes.subarray(thumbEnd),
  };
}
