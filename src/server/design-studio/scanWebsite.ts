/**
 * Fetch a visitor's existing website and extract brief cues + logo candidates.
 * Used during Design Studio generation — not a full browser crawl.
 */

export type WebsiteScanResult = {
  url: string;
  ok: boolean;
  title?: string;
  description?: string;
  headings?: string[];
  textSample?: string;
  themeColor?: string;
  logoCandidateUrls?: string[];
  error?: string;
};

const MAX_HTML_BYTES = 1_200_000;
const FETCH_TIMEOUT_MS = 12_000;

function normalizeWebsiteUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host === '0.0.0.0' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host) ||
      host.startsWith('169.254.') ||
      host === 'metadata.google.internal'
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function stripTags(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim(),
  );
}

function metaContent(html: string, names: string[]): string | undefined {
  for (const name of names) {
    const patterns = [
      new RegExp(
        `<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']`,
        'i',
      ),
      new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,
        'i',
      ),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeHtmlEntities(match[1].trim());
    }
  }
  return undefined;
}

function absoluteUrl(base: URL, href: string): string | null {
  try {
    return new URL(href, base).toString();
  } catch {
    return null;
  }
}

function extractLogoCandidates(html: string, base: URL): string[] {
  const found: string[] = [];
  const push = (href: string | undefined) => {
    if (!href) return;
    const abs = absoluteUrl(base, href);
    if (abs && !found.includes(abs)) found.push(abs);
  };

  push(metaContent(html, ['og:image', 'twitter:image', 'og:image:url']));

  const linkRel =
    /<link[^>]+rel=["']([^"']+)["'][^>]+href=["']([^"']+)["'][^>]*>/gi;
  const linkRelAlt =
    /<link[^>]+href=["']([^"']+)["'][^>]+rel=["']([^"']+)["'][^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = linkRel.exec(html))) {
    const rel = match[1]?.toLowerCase() || '';
    if (rel.includes('icon') || rel.includes('apple-touch-icon')) push(match[2]);
  }
  while ((match = linkRelAlt.exec(html))) {
    const rel = match[2]?.toLowerCase() || '';
    if (rel.includes('icon') || rel.includes('apple-touch-icon')) push(match[1]);
  }

  const imgTag =
    /<img[^>]+(?:src|data-src)=["']([^"']+)["'][^>]*(?:alt|class|id)=["']([^"']*)["'][^>]*>/gi;
  const imgTagAlt =
    /<img[^>]+(?:alt|class|id)=["']([^"']*)["'][^>]*(?:src|data-src)=["']([^"']+)["'][^>]*>/gi;
  while ((match = imgTag.exec(html))) {
    const label = `${match[2] || ''} ${match[1] || ''}`.toLowerCase();
    if (label.includes('logo') || label.includes('brand')) push(match[1]);
  }
  while ((match = imgTagAlt.exec(html))) {
    const label = `${match[1] || ''} ${match[2] || ''}`.toLowerCase();
    if (label.includes('logo') || label.includes('brand')) push(match[2]);
  }

  return found.slice(0, 6);
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const re = /<h[1-3][^>]*>([\s\S]*?)<\/h[1-3]>/gi;
  let match: RegExpExecArray | null;
  while ((match = re.exec(html))) {
    const text = stripTags(match[1] || '').slice(0, 120);
    if (text && !headings.includes(text)) headings.push(text);
    if (headings.length >= 8) break;
  }
  return headings;
}

/**
 * Scan an existing business website for copy cues and logo candidates.
 */
export async function scanExistingWebsite(
  rawUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<WebsiteScanResult> {
  const url = normalizeWebsiteUrl(rawUrl);
  if (!url) {
    return { url: rawUrl.trim(), ok: false, error: 'invalid_url' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'WellMediaDesignStudioBot/1.0 (+https://thewellmedia.com)',
      },
    });

    if (!response.ok) {
      return {
        url: url.toString(),
        ok: false,
        error: `http_${response.status}`,
      };
    }

    const buffer = await response.arrayBuffer();
    const bytes = buffer.byteLength > MAX_HTML_BYTES
      ? buffer.slice(0, MAX_HTML_BYTES)
      : buffer;
    const html = new TextDecoder('utf-8', { fatal: false }).decode(bytes);

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch?.[1] ? stripTags(titleMatch[1]).slice(0, 160) : undefined;
    const description = metaContent(html, [
      'description',
      'og:description',
      'twitter:description',
    ])?.slice(0, 400);
    const themeColor = metaContent(html, ['theme-color']);
    const headings = extractHeadings(html);
    const textSample = stripTags(html).slice(0, 1800);
    const logoCandidateUrls = extractLogoCandidates(html, url);

    return {
      url: url.toString(),
      ok: true,
      title,
      description,
      headings,
      textSample,
      themeColor,
      logoCandidateUrls,
    };
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    return {
      url: url.toString(),
      ok: false,
      error: aborted ? 'timeout' : 'fetch_failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchLogoBytes(
  logoUrl: string,
  fetchImpl: typeof fetch = fetch,
): Promise<{ bytes: Uint8Array; mimeType: string; filename: string } | null> {
  const url = normalizeWebsiteUrl(logoUrl);
  if (!url) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url.toString(), {
      method: 'GET',
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        accept: 'image/avif,image/webp,image/png,image/jpeg,image/*,*/*',
        'user-agent': 'WellMediaDesignStudioBot/1.0 (+https://thewellmedia.com)',
      },
    });
    if (!response.ok) return null;

    const buffer = await response.arrayBuffer();
    if (buffer.byteLength < 64 || buffer.byteLength > 8 * 1024 * 1024) return null;

    const bytes = new Uint8Array(buffer);
    const headerType = (response.headers.get('content-type') || '').split(';')[0]?.trim() || '';
    const path = url.pathname.toLowerCase();
    let mimeType = headerType;
    if (!mimeType.startsWith('image/')) {
      if (path.endsWith('.png')) mimeType = 'image/png';
      else if (path.endsWith('.webp')) mimeType = 'image/webp';
      else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (path.endsWith('.gif')) mimeType = 'image/gif';
      else if (path.endsWith('.svg')) mimeType = 'image/svg+xml';
      else mimeType = 'image/png';
    }

    // Skip SVG/GIF for R2 logo pipeline (upload validator is jpeg/png/webp).
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mimeType)) {
      return null;
    }

    const ext =
      mimeType === 'image/jpeg' ? '.jpg' : mimeType === 'image/webp' ? '.webp' : '.png';
    return {
      bytes,
      mimeType,
      filename: `scraped-logo${ext}`,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
