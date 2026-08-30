const PNG = [0x89, 0x50, 0x4e, 0x47];
const JPEG = [0xff, 0xd8, 0xff];

export function looksLikePng(bytes: Uint8Array) {
  return PNG.every((value, index) => bytes[index] === value);
}

export function looksLikeJpeg(bytes: Uint8Array) {
  return JPEG.every((value, index) => bytes[index] === value);
}

export function looksLikeWebp(bytes: Uint8Array) {
  if (bytes.byteLength < 12) {
    return false;
  }
  const riff = String.fromCharCode(bytes[0]!, bytes[1]!, bytes[2]!, bytes[3]!);
  const webp = String.fromCharCode(bytes[8]!, bytes[9]!, bytes[10]!, bytes[11]!);
  return riff === "RIFF" && webp === "WEBP";
}

export function assertAllowedUploadBytes(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/png" && looksLikePng(bytes)) {
    return;
  }
  if (mimeType === "image/jpeg" && looksLikeJpeg(bytes)) {
    return;
  }
  if (mimeType === "image/webp" && looksLikeWebp(bytes)) {
    return;
  }
  if (mimeType.startsWith("video/")) {
    return;
  }
  throw new Error("That file does not match the type we expected.");
}
