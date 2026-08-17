# AI Quick Rules

Compact rules for AI agents working in this repo. For component catalogs, design tokens, config schemas, and full checklists, read [`AI_TEMPLATE_RULES.md`](AI_TEMPLATE_RULES.md).

## Document map

| Document | Use when |
| -------- | -------- |
| `AI_QUICK_RULES.md` | Every session — constraints and workflow |
| `AI_TEMPLATE_RULES.md` | Architecture, new components, design system, page composition |
| `NEW_WEBSITE_INPUT_SPEC.md` | Template for a new client's content |
| `*WebsiteInputSpec.md` | Business copy and values for a specific site (e.g. Well Media) |
| `README.md` | Setup, deployment, repo strategy overview |

**Client content** comes from the website input spec → `src/config/`. **Platform behavior** comes from components and these rules.

## Repository strategy

| Branch | Role |
| ------ | ---- |
| `main` | Reusable template platform |
| `wellmedia` | The Well Media House — **only** client site in this repo |

New client sites: **clone to a dedicated repo** per site. Do not add more client branches here.

At ~30 sites: plan a **monorepo** (shared platform + one subfolder per site). Until then, keep each site self-contained so it maps cleanly to a future subfolder.

## Hard constraints

- **Stack:** Astro, TypeScript, Tailwind CSS v4, MDX. Static output only.
- **Deploy target:** Cloudflare Pages.
- **Do not add** React, Vue, Angular, Svelte, SSR, databases, or backends unless explicitly requested.
- **Client content in config**, not in shared components or platform rules.
- **Reuse** existing components, layouts, and semantic theme classes before creating new ones.
- **Extend** generic patterns; do not fork platform code per client.

## Config files (`src/config/`)

Core (every site): `site.ts`, `company.ts`, `navigation.ts`, `services.ts`, `seo.ts`, `form.ts`

Optional (when spec requires): `design.ts`, `packages.ts`, `portfolio.ts` (listing + `/portfolio/[slug]` detail pages), `content.ts`, `faq.ts`, `testimonials.ts`, `pages.ts`

Pages compose section components; section visibility and page toggles live in `pages.ts`.

## Styling

- Use **semantic classes**: `text-fg`, `text-fg-muted`, `text-fg-soft`, `surface-card`, `btn-accent`, etc.
- **Do not use** `text-neutral-*`, `bg-white`, or other palette classes that assume a light theme.
- Brand colors flow: `site.ts` branding → `branding.ts` CSS variables → `global.css` semantic utilities.
- Optional extended tokens: `design.ts` (enable for dark/premium sites).

## Forms

- Provider-agnostic via `src/config/form.ts`.
- **Default provider:** FormSubmit (`endpoint` = recipient email, or `PUBLIC_FORMSUBMIT_EMAIL`).
- Also supported: Formspree, Web3Forms, custom POST URL.
- Field definitions, dropdown options, and messages belong in config — not hardcoded in `ContactForm.astro`.

## Build workflow (new or updated site)

1. Read the website input spec for business values.
2. Update `src/config/*` from the spec.
3. Compose pages from existing section components.
4. Add new components only when no existing section fits.
5. Replace assets in `public/` and `src/assets/`.
6. Keep static generation; add client JS only where it adds clear value.
7. Verify responsive layout, accessible labels, and SEO metadata.

## Before writing code

1. Check whether the value belongs in config.
2. Search for an existing component to reuse.
3. Match surrounding naming, types, and import style.
4. Keep diffs minimal — no unrelated changes.

## When to read `AI_TEMPLATE_RULES.md`

- Adding or restructuring components
- Design system / token changes
- New page types or section patterns
- Full site build from an input spec
- SEO, accessibility, or performance checklists in detail

## Success check

A site should be launchable by changing config, assets, and input-spec-driven content — without architectural changes to shared components.
