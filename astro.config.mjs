import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

import { DESIGN_STUDIO_ENABLED } from './src/config/designStudio.flag.ts';
import { siteConfig } from './src/config/site.ts';

const siteUrl = process.env.PUBLIC_SITE_URL || siteConfig.url;

/** Publish Design Studio routes only when DESIGN_STUDIO_ENABLED is true. */
function designStudioRoutes() {
  return {
    name: 'design-studio-routes',
    hooks: {
      'astro:config:setup'({ injectRoute }) {
        if (!DESIGN_STUDIO_ENABLED) return;
        const pages = './src/features/design-studio/pages';
        const routes = [
          ['/design-your-website', `${pages}/index.astro`],
          ['/design-your-website/create', `${pages}/create.astro`],
          ['/design-your-website/contact', `${pages}/contact.astro`],
          ['/design-your-website/results', `${pages}/results/index.astro`],
          ['/design-your-website/results/demo', `${pages}/results/demo.astro`],
          ['/design-your-website/payment/success', `${pages}/payment/success.astro`],
          ['/design-your-website/payment/cancel', `${pages}/payment/cancel.astro`],
          ['/design-your-website/internal', `${pages}/internal/index.astro`],
        ];
        for (const [pattern, entrypoint] of routes) {
          injectRoute({ pattern, entrypoint });
        }
      },
    },
  };
}

export default defineConfig({
  site: siteUrl,
  output: 'static',
  integrations: [
    mdx(),
    designStudioRoutes(),
    sitemap({
      filter: (page) => DESIGN_STUDIO_ENABLED || !page.includes('/design-your-website'),
    }),
  ],
  redirects: {
    '/services': '/pricing',
  },
  build: {
    // External CSS was the remaining mobile render-blocking bottleneck (~1.2s
    // estimated). Auto only inlines sheets under ~4KB; homepage CSS exceeds that.
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
    plugins: [tailwindcss()],
  },
});
