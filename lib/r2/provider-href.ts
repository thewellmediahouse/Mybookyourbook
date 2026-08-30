import { createHmac, timingSafeEqual } from "node:crypto";
import { workspacePrefix } from "./keys";

const TOKEN_TTL_SECONDS = 60 * 60;

export function workspaceIdFromObjectKey(objectKey: string): string | null {
  const match = /^workspaces\/([^/]+)\//.exec(objectKey);
  return match?.[1] ?? null;
}

export function signProviderObjectToken(secret: string, objectKey: string, expiresAt: number): string {
  const payload = Buffer.from(JSON.stringify({ k: objectKey, e: expiresAt }), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function verifyProviderObjectToken(
  secret: string,
  token: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): { objectKey: string } | null {
  const dot = token.indexOf(".");
  if (dot < 8) {
    return null;
  }
  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = createHmac("sha256", secret).update(payload).digest("base64url");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      k?: unknown;
      e?: unknown;
    };
    if (typeof parsed.k !== "string" || typeof parsed.e !== "number") {
      return null;
    }
    if (parsed.e < nowSeconds) {
      return null;
    }
    if (!parsed.k.startsWith("workspaces/") || !workspaceIdFromObjectKey(parsed.k)) {
      return null;
    }
    if (parsed.k.includes("..") || parsed.k.includes("//")) {
      return null;
    }
    return { objectKey: parsed.k };
  } catch {
    return null;
  }
}

export function providerObjectHref(input: {
  appUrl: string;
  secret: string;
  objectKey: string;
  nowSeconds?: number;
}): string {
  const expiresAt = (input.nowSeconds ?? Math.floor(Date.now() / 1000)) + TOKEN_TTL_SECONDS;
  const token = signProviderObjectToken(input.secret, input.objectKey, expiresAt);
  return `${input.appUrl.replace(/\/$/, "")}/api/provider/files/${token}`;
}

export function canUseProviderHrefs(appUrl: string, secret: string): boolean {
  if (!secret.trim()) {
    return false;
  }
  try {
    const url = new URL(appUrl);
    return url.protocol === "https:" && Boolean(url.host) && !url.hostname.includes("localhost");
  } catch {
    return false;
  }
}

export function objectKeyMatchesWorkspace(objectKey: string, workspaceId: string): boolean {
  return objectKey.startsWith(workspacePrefix(workspaceId));
}
