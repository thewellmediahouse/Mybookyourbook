/** Public-page facts only. Never invent a tagline, offer, or phone number. */

const BLOCKED_HOSTS = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1", "[::1]"]);
const MAX_HTML_BYTES = 500_000;

export type PageMeta = {
  url: string;
  title: string;
  description: string;
};

export function parsePublicHttpUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    const host = url.hostname.trim().toLowerCase();
    if (!host || BLOCKED_HOSTS.has(host) || host.endsWith(".local") || host.endsWith(".internal")) {
      return null;
    }
    if (isPrivateHostname(host)) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function isPrivateHostname(host: string): boolean {
  if (host === "metadata.google.internal") {
    return true;
  }
  const ipv4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4) {
    return false;
  }
  const parts = ipv4.slice(1).map((part) => Number(part));
  if (parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return false;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  return false;
}

function attr(html: string, names: string[]): string {
  for (const name of names) {
    const property = new RegExp(
      `<meta[^>]+(?:property|name)=["']${name}["'][^>]+content=["']([^"']+)["']`,
      "i",
    );
    const contentFirst = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${name}["']`,
      "i",
    );
    const match = html.match(property) ?? html.match(contentFirst);
    const value = match?.[1]?.trim();
    if (value) {
      return decodeHtml(value).slice(0, 240);
    }
  }
  return "";
}

function decodeHtml(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function parsePageMetaFromHtml(html: string, sourceUrl: string): PageMeta {
  const titleTag = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ?? "";
  return {
    url: sourceUrl,
    title: attr(html, ["og:title", "twitter:title"]) || decodeHtml(titleTag).slice(0, 240),
    description: attr(html, ["og:description", "twitter:description", "description"]),
  };
}

export async function fetchPublicPageMeta(
  rawUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ ok: true; meta: PageMeta } | { ok: false; reason: string }> {
  const url = parsePublicHttpUrl(rawUrl);
  if (!url) {
    return { ok: false, reason: "Use a normal website address." };
  }
  let response: Response;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      response = await fetchImpl(url.toString(), {
        method: "GET",
        redirect: "follow",
        headers: { Accept: "text/html,application/xhtml+xml" },
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  } catch {
    return { ok: false, reason: "We couldn't open that page. You can still type the brief yourself." };
  }
  if (!response.ok) {
    return { ok: false, reason: "We couldn't open that page. You can still type the brief yourself." };
  }
  const finalUrl = parsePublicHttpUrl(response.url || url.toString());
  if (!finalUrl) {
    return { ok: false, reason: "That page is not a public website we can read." };
  }
  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_HTML_BYTES) {
    return { ok: false, reason: "That page is too large to read automatically." };
  }
  const html = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const meta = parsePageMetaFromHtml(html, finalUrl.toString());
  if (!meta.title && !meta.description) {
    return { ok: false, reason: "That page did not publish a title we can use. Enter the brief yourself." };
  }
  return { ok: true, meta };
}
