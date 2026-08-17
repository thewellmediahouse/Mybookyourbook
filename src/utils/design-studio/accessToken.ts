/**
 * Anonymous project access tokens.
 * Raw token is returned once to the client; only the hash is stored in D1.
 */

const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (let i = 0; i < view.length; i += 1) {
    binary += String.fromCharCode(view[i]!);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

export async function generateAccessToken(byteLength = 32): Promise<string> {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return toBase64Url(bytes);
}

export async function hashAccessToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return toBase64Url(digest);
}

/** Constant-time string compare for equal-length base64url hashes. */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i)! ^ b.charCodeAt(i)!;
  }
  return mismatch === 0;
}

export async function verifyAccessToken(
  token: string,
  expectedHash: string,
): Promise<boolean> {
  if (!token || !expectedHash) return false;
  const actualHash = await hashAccessToken(token);
  return timingSafeEqual(actualHash, expectedHash);
}

export const timingSafe = {
  equal: timingSafeEqual,
};

export function createProjectId(): string {
  return crypto.randomUUID();
}

export function createPublicReference(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let code = '';
  for (const byte of bytes) {
    code += alphabet[byte! % alphabet.length];
  }
  return `WM-${code}`;
}
