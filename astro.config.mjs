import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { siteConfig } from './src/config/site.ts';

const siteUrl = process.env.PUBLIC_SITE_URL || siteConfig.url;
const isPreview =
  String(process.env.PUBLIC_SITE_ENV ?? '')
    .trim()
    .toLowerCase() === 'preview';

function isCartPath(pageUrl) {
  const pathname = new URL(pageUrl).pathname.replace(/\/+$/, '');
  return pathname.endsWith('/cart') || pathname === '/cart';
}

function isPrivateUtilityPath(pageUrl) {
  const pathname = new URL(pageUrl).pathname.replace(/\/+$/, '') || '/';
  if (pathname === '/thank-you' || pathname.endsWith('/thank-you')) return true;
  return false;
}

/** Drop utility routes from the production sitemap. */
function includeInSitemap(pageUrl) {
  if (isCartPath(pageUrl)) return false;
  if (isPrivateUtilityPath(pageUrl)) return false;
  return true;
}

/** Merge preview noindex into existing public/_headers — never overwrite security/cache rules. */
function mergePreviewNoindexHeaders(headersPath) {
  let existing = '';
  try {
    existing = fs.readFileSync(headersPath, 'utf8');
  } catch {
    // public/_headers may be absent
  }

  if (/X-Robots-Tag:\s*noindex/i.test(existing)) {
    return;
  }

  const robotLine = '  X-Robots-Tag: noindex, nofollow\n';
  if (/^\/\*[ \t]*$/m.test(existing)) {
    fs.writeFileSync(headersPath, existing.replace(/^(\/\*[ \t]*\n)/m, `$1${robotLine}`), 'utf8');
    return;
  }

  const prefix = existing.trim() ? `${existing.trimEnd()}\n\n` : '';
  fs.writeFileSync(headersPath, `${prefix}/*\n${robotLine}`, 'utf8');
}

export default defineConfig({
  site: siteUrl,
  output: 'static',
  // Directory index HTML (`about/index.html`) is the natural URL shape on
  // Cloudflare Pages / Workers static assets — keep canonicals, sitemap, and links aligned.
  trailingSlash: 'always',
  integrations: isPreview
    ? [mdx()]
    : [
        mdx(),
        sitemap({
          filter: includeInSitemap,
        }),
      ],
  build: {
    // External CSS was a mobile render-blocking bottleneck. Auto only inlines
    // sheets under ~4KB; site CSS typically exceeds that, so always inline.
    inlineStylesheets: 'always',
  },
  image: {
    service: {
      config: {
        // Higher default quality restores crispness after resize/re-encode;
        // per-image `quality` on <Image>/OptimizedImage still wins when set.
        webp: { effort: 4, quality: 88 },
        png: { compressionLevel: 9 },
      },
    },
  },
  vite: {
    plugins: [
      tailwindcss(),
      {
        name: 'preview-noindex-headers',
        closeBundle() {
          if (!isPreview) return;
          mergePreviewNoindexHeaders(path.join(process.cwd(), 'dist', '_headers'));
        },
      },
    ],
  },
});
