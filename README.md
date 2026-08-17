# Astro Business Template

A reusable Astro starter for small business, agency, and professional services websites. Content, branding, navigation, services, pricing, forms, and SEO are driven from typed config files — not hardcoded in components.

Built for static deployment (Cloudflare Pages), fast Lighthouse scores, and easy customization by humans or AI agents.

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

This repo is the **shared template platform**. Client-specific work stays isolated so each site can live in its own repository — and later in its own monorepo subfolder.

| Branch | Purpose |
| ------ | ------- |
| `main` | Template only — generic placeholder content and reusable platform code |
| `wellmedia` | [The Well Media House](docs/TheWellMediaHouseWebsiteInputSpec.md) — the **only** client site maintained in this repo |

**New client sites:** clone this repository into a **dedicated repo per site**. Do not add further client branches here.

**At scale (~30 sites):** plan a **monorepo** — shared platform code plus one subfolder per website (e.g. `sites/wellmedia/`, `sites/acme/`). Until then, each standalone clone maps cleanly to a future subfolder.

**Development principle:** keep platform code generic on `main`, keep all client content in `src/config/` and input specs, and keep each site self-contained. New features should not assume a single-repo, multi-branch layout beyond `main` + `wellmedia`.

## Creating a new website

1. Clone this template into a **new repository** (or use the `wellmedia` branch pattern only for The Well Media House in this repo).
2. Copy or fill in [`docs/NEW_WEBSITE_INPUT_SPEC.md`](docs/NEW_WEBSITE_INPUT_SPEC.md) with the client's details.
3. Follow [`docs/AI_TEMPLATE_RULES.md`](docs/AI_TEMPLATE_RULES.md) for architecture, components, and design patterns.
4. Update files under `src/config/` (see below).
5. Replace assets in `public/` and `src/assets/`.
6. Adjust page composition in `src/config/pages.ts` and individual pages under `src/pages/`.
7. Deploy to Cloudflare Pages (or any static host).

Most sites should be launchable by changing config and assets only — no component rewrites.

## Configuration

Business-specific content lives in `src/config/`:

| File | Contents |
| ---- | -------- |
| `site.ts` | Site name, URL, taglines, branding colors, design rules |
| `company.ts` | Email, phone, address, social links, differentiators |
| `navigation.ts` | Header/footer nav and CTA labels |
| `services.ts` | Service list and descriptions |
| `packages.ts` | Tiered pricing, bundles, à la carte, terminology (optional) |
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

Other supported providers:

| Provider | `endpoint` value |
| -------- | ---------------- |
| `formsubmit` | Recipient email address |
| `formspree` | Form ID or full Formspree URL |
| `web3forms` | Web3Forms access key |
| `custom` | Any POST URL (native submit, no AJAX) |

Fields, labels, dropdown options, and success/error messages are all defined in `form.ts`.

## Project structure

```
src/
  components/
    layout/       Header, Footer, Navigation
    sections/     Page sections (heroes, CTAs, grids, strips)
    ui/           Buttons, cards, headings, containers
    forms/        ContactForm and field components
    media/        Portfolio and video placeholders
    utility/      SEO, page headers, messaging bubble
  config/         Typed business configuration
  content/        MDX blog posts (optional)
  layouts/        BaseLayout, PageLayout
  pages/          Route files
  styles/         Global CSS and design tokens
docs/
  AI_QUICK_RULES.md                 Compact always-on rules for AI agents
  AI_TEMPLATE_RULES.md              Platform architecture and component rules
  NEW_WEBSITE_INPUT_SPEC.md         Template for per-client content input
  TheWellMediaHouseWebsiteInputSpec.md  Example filled-in client spec
public/                             Static assets (logo, favicon, placeholders)
```

## Pages

Default routes included in the template:

- `/` — Home
- `/about` — About
- `/services` — Services
- `/contact` — Contact form
- `/faq` — FAQ
- `/portfolio` — Portfolio listing (when enabled)
- `/portfolio/[slug]` — Portfolio item detail pages (generated from `portfolio.ts`)
- `/privacy`, `/terms` — Legal pages
- `/404` — Not found

Enable or disable pages and individual sections via `src/config/pages.ts`.

## Deployment

The site builds to static HTML in `dist/`. Target deployment is **Cloudflare Pages**:

1. Connect the GitHub repository.
2. Build command: `npm run build`
3. Output directory: `dist`
4. Set environment variables (`PUBLIC_FORMSUBMIT_EMAIL`, etc.) in the Cloudflare dashboard.

Update `siteConfig.url` in `src/config/site.ts` to your production domain for correct sitemap and canonical URLs.

## Documentation

- [`docs/AI_QUICK_RULES.md`](docs/AI_QUICK_RULES.md) — Compact rules for AI agents (always-on context)
- [`docs/AI_TEMPLATE_RULES.md`](docs/AI_TEMPLATE_RULES.md) — Full platform architecture, components, theming, forms, SEO, performance
- [`docs/NEW_WEBSITE_INPUT_SPEC.md`](docs/NEW_WEBSITE_INPUT_SPEC.md) — Blank spec to fill in for each new client site
- [`docs/TheWellMediaHouseWebsiteInputSpec.md`](docs/TheWellMediaHouseWebsiteInputSpec.md) — Reference example of a completed spec

Cursor loads the same quick rules automatically via `.cursor/rules/template-platform.mdc`.

## License

Private template — adjust licensing as needed for your use.
