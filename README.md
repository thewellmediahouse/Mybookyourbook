# Astro Business Template

A reusable Astro starter for small business, agency, and professional services websites. Content, branding, navigation, services, pricing, forms, and SEO are driven from typed config files — not hardcoded in components.

Built for **AI-agent site generation**, static deployment (Cloudflare Pages), and near-perfect Lighthouse scores.

## Tech stack

- [Astro](https://astro.build) (static output)
- TypeScript
- Tailwind CSS v4
- MDX (optional blog/content)

## Quick start

```bash
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321).

```bash
npm run build    # static output in dist/
npm run preview  # preview production build locally
npm run check    # Astro + TypeScript checks
```

## Repository strategy

| Branch | Purpose |
| ------ | ------- |
| `main` | Template only — generic placeholder content and reusable platform code |
| `wellmedia` | The Well Media House — the **only** client site maintained in this repo |

**New client sites:** clone into a **dedicated repo per site**. Do not add further client branches here.

**At scale (~30 sites):** plan a **monorepo** — shared platform plus one subfolder per website. Until then, each clone maps cleanly to a future subfolder.

## Creating a new website (AI-first)

### Content person (ChatGPT, external)

1. Open a ChatGPT Project and upload the pack listed in [`docs/prompts/README.md`](docs/prompts/README.md).
2. Use [`docs/prompts/01-fill-spec.md`](docs/prompts/01-fill-spec.md) as instructions.
3. Paste company context; download **`SITE_SPEC.yaml` + images**.

### Developer (Cursor)

1. Provision infra: private GitHub repo → invite [thewellmediahouse](https://github.com/thewellmediahouse) → Cloudflare Pages preview at `<repo>.thewellmedia.com` — see [`docs/DEPLOY.md`](docs/DEPLOY.md) (script: `scripts/provision-site.sh`; skill: `.cursor/skills/site-provision`).
2. Drop `SITE_SPEC.yaml` + images into the repo.
3. Apply with Cursor using [`docs/prompts/02-apply-spec.md`](docs/prompts/02-apply-spec.md) (updates `src/config/*`).
4. Wire assets via [`docs/prompts/03-assets.md`](docs/prompts/03-assets.md).
5. `npm run check && npm run build`.
6. Lighthouse loop: [`docs/prompts/04-lighthouse.md`](docs/prompts/04-lighthouse.md) (target ≥90, aim 100).

Most sites should launch by changing config and assets only — no component rewrites.

## Configuration

Business-specific content lives in `src/config/`:

| File | Contents |
| ---- | -------- |
| `site.ts` | Site name, URL, taglines, branding colors, design rules |
| `company.ts` | Email, phone, address, social links, differentiators |
| `navigation.ts` | Header/footer nav and CTA labels |
| `services.ts` | Service list and descriptions |
| `packages.ts` | Tiered pricing, bundles, à la carte (optional) |
| `portfolio.ts` | Portfolio items, Featured Work Preview |
| `faq.ts` | FAQ entries |
| `testimonials.ts` | Testimonials (optional) |
| `seo.ts` | Per-page SEO titles and descriptions |
| `form.ts` | Contact form provider, fields, and messages |
| `pages.ts` | Page visibility and section enable/disable |
| `content.ts` | Long-form page copy blocks |
| `design.ts` | Extended design tokens (optional) |

### Environment variables

Copy `.env.example` to `.env` for local overrides:

```bash
PUBLIC_SITE_URL=https://yourdomain.com
PUBLIC_SITE_ENV=preview          # Well Media staging Pages builds; omit in production
PUBLIC_FORMSUBMIT_EMAIL=hello@yourdomain.com
PUBLIC_WEB3FORMS_KEY=your-web3forms-access-key
```

## Contact forms

Forms are provider-agnostic. Configure in `src/config/form.ts`.

**FormSubmit (default)** — no signup, emails go to your inbox:

```ts
provider: 'formsubmit',
endpoint: import.meta.env.PUBLIC_FORMSUBMIT_EMAIL ?? companyConfig.email,
```

After deploying, submit the form once on the live site and confirm via [FormSubmit](https://formsubmit.co/)'s activation email.

| Provider | `endpoint` value |
| -------- | ---------------- |
| `formsubmit` | Recipient email address |
| `formspree` | Form ID or full Formspree URL |
| `web3forms` | Web3Forms access key |
| `custom` | Any POST URL (native submit, no AJAX) |

## Project structure

```
src/
  components/     layout, sections, marketing, ui, forms, media, utility
  config/         Typed business configuration
  content/        MDX blog posts (optional)
  layouts/        BaseLayout, PageLayout
  pages/          Route files
  assets/         Rasters + raster.ts
  styles/         Global CSS and design tokens
docs/
  AGENT.md                    Always-on agent contract
  PLATFORM.md                 Component/token/SEO lookup
  DEPLOY.md                   Repo + Cloudflare Pages preview provision
  SITE_SPEC.schema.json       Content pack schema
  SITE_SPEC.example.yaml      Few-shot example (Acme)
  prompts/                    ChatGPT + Cursor prompt pack
  _legacy/                    Archived human-oriented docs
scripts/
  provision-site.sh           Private repo + wrangler rename helper
public/                       SVG, favicon, video
```

## Pages

- `/` — Home
- `/about` — About
- `/services` — Services
- `/contact` — Contact form
- `/faq` — FAQ
- `/portfolio` — Portfolio listing (when enabled)
- `/portfolio/[slug]` — Portfolio detail (from `portfolio.ts`)
- `/privacy`, `/terms` — Legal
- `/404` — Not found

Enable or disable pages and sections via `src/config/pages.ts`.

## Deployment

Build to static HTML in `dist/`. Target: **Cloudflare Pages**.

**Well Media preview sites** (private repo, `<repo>.thewellmedia.com`, `PUBLIC_SITE_ENV=preview`, non-prod branch builds off): follow [`docs/DEPLOY.md`](docs/DEPLOY.md).

Quick Pages settings for any site:

1. Connect the GitHub repository.
2. Build command: `npm run build` → output `dist`
3. Set env vars in the Cloudflare dashboard (see `.env.example`).
4. Match `wrangler.jsonc` `"name"` to the Pages project name.

**Lockfile / npm:** Pages v3 runs `npm ci` with **npm 10.9.2** even if `.nvmrc` selects Node 24. After dependency changes, regenerate `package-lock.json` with npm 10 and confirm `npx npm@10.9.2 ci` succeeds. Details: [`docs/PLATFORM.md`](docs/PLATFORM.md).

Update `siteConfig.url` in `src/config/site.ts` (and `PUBLIC_SITE_URL`) to the live domain for sitemap and canonical URLs.

## Documentation

| Doc | Audience |
| --- | -------- |
| [`docs/AGENT.md`](docs/AGENT.md) | Every agent session |
| [`docs/PLATFORM.md`](docs/PLATFORM.md) | Build/debug lookup |
| [`docs/DEPLOY.md`](docs/DEPLOY.md) | Clone → GitHub → Pages preview provision |
| [`docs/SITE_SPEC.schema.json`](docs/SITE_SPEC.schema.json) | ChatGPT + validation |
| [`docs/SITE_SPEC.example.yaml`](docs/SITE_SPEC.example.yaml) | Few-shot filled spec |
| [`docs/prompts/`](docs/prompts/) | Fill / apply / assets / Lighthouse |
| [`docs/_legacy/`](docs/_legacy/) | Archived predecessors |

Cursor loads the agent contract via `.cursor/rules/template-platform.mdc` (plus scoped rules for config, components, and styles).

## License

Private template — adjust licensing as needed for your use.
