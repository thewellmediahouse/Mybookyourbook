# AI_TEMPLATE_RULES.md

## Purpose

This repository is a reusable Astro business website starter template.

It is intended to generate websites for:

* Small businesses
* Consultants
* Agencies
* SaaS products
* Local service providers
* Professional services
* Startups
* Marketing websites
* Media and creative agencies
* Growth and strategy consultancies

This repository is not a single website.

It is a platform used to create many independent websites.

---

## Repository Strategy

### What lives in this repo

| Branch | Role |
| ------ | ---- |
| `main` | Reusable template platform — components, layouts, and generic config patterns |
| `wellmedia` | The Well Media House — the **only** client site co-located here (reference implementation) |

Do **not** add further client branches to this repository.

### How new sites are created

For each new client site, **clone this template into a dedicated repository**, fill in a website input spec, and customize `src/config/` and assets.

Once the portfolio reaches roughly **30 sites**, evaluate a **monorepo**: shared platform at the root (or in packages), with **one subfolder per website** (e.g. `sites/wellmedia/`, `sites/acme/`).

Until that migration, each standalone clone should map cleanly to a future monorepo subfolder.

### Development for future migration

Design and implement with the monorepo path in mind:

* Keep all client-specific content in `src/config/`, content files, and input specs — never in shared components
* Do not hardcode client names, URLs, or copy into platform components or these rules
* Avoid cross-site imports, shared runtime state, or assumptions that multiple clients live in one repo
* Extend generic components and config patterns rather than forking platform code per client
* Treat each cloned repository (and the `wellmedia` branch) as a future **package or subfolder boundary**

---

## Separation of Concerns

This document defines **platform architecture, theming, and component capabilities**.

It does not contain business-specific content, copy, pricing, or branding for any particular client.

| Document | Role |
| -------- | ---- |
| `AI_QUICK_RULES.md` | Compact always-on rules — constraints, doc map, workflow |
| `AI_TEMPLATE_RULES.md` | Reusable platform rules — architecture, components, design system, config patterns |
| `NEW_WEBSITE_INPUT_SPEC.md` | Per-website content source — company details, copy, services, pricing, images, SEO keywords |

When building a new website:

1. Start with `AI_QUICK_RULES.md` (or the matching Cursor rule) for constraints and workflow.
2. Follow the architecture and patterns in this document when detail is needed.
3. Populate configuration files from the website input specification.
4. Do not hardcode client-specific content into components or platform rules.

---

## Primary Objectives

Every generated website must be:

* Fast
* SEO friendly
* Mobile first
* Accessible
* Easy to customize
* Easy to maintain
* Easy for AI agents to modify
* Deployable to Cloudflare Pages
* Content driven through config files
* Component driven with reusable sections
* Designed to convert visitors into enquiries or bookings

---

## Technology Stack

Required:

* Astro
* TypeScript
* Tailwind CSS
* MDX

Deployment Target:

* Cloudflare Pages

Repository Host:

* GitHub

Do not introduce React, Vue, Angular, Svelte, or server-side rendering unless explicitly requested.

---

## Architecture Principles

### Static First

Use static generation by default.

Do not introduce:

* Databases
* Server runtime requirements
* Custom backend infrastructure
* SSR unless explicitly requested

Interactive-looking elements such as calendars, video placeholders, filters, and pricing selectors can be built as static mockups first. Add client-side JavaScript only where it creates clear value.

### Component Driven

Build reusable components first.

Prefer reusable sections over page-specific custom markup.

Organize components by responsibility (layout, sections, UI, media, forms, utility).

Avoid duplicated structures for cards, CTAs, section headings, galleries, buttons, and forms.

### Content Driven

Most business information must live in configuration files, not inside page markup.

Pages should render from config files wherever practical.

Content that should live in config:

* Company details
* Navigation
* Services
* Packages and pricing
* Portfolio categories and items
* Contact details
* Form fields and options
* SEO metadata
* CTAs
* Footer links
* FAQs and testimonials

### AI-Agent Friendly

The architecture must be easy for AI agents to update.

Use clear file names, typed config objects, predictable component structure, and comments where future edits are likely.

### Separation of Platform and Content

Components and layouts are generic and reusable.

Business copy, pricing, images, and branding values come from config files populated from the website input specification.

---

## Required Directory Structure

Maintain and extend this structure as websites grow in complexity:

```txt
src/
  assets/
    brand/          # logos, favicons
    images/         # hero, service, team, and general imagery
    gallery/        # portfolio items organized by category (optional)
  components/
    layout/         # Header, Footer, Navigation, MobileNavigation
    sections/       # page sections (Hero variants, CTAs, grids, strips)
    marketing/      # legacy/alternate location for marketing sections
    ui/             # Button, Card, Badge, Container, Section, etc.
    media/          # VideoPlaceholder, PortfolioCard, ImageCard, PlayButton
    forms/          # ContactForm, FormField, SelectField, booking mockups
    utility/        # SEO, Schema, PageHeader, SectionWrapper, contact bubbles
  content/
    blog/
    case-studies/
    faqs/
    testimonials/
  config/
    site.ts
    company.ts
    navigation.ts
    services.ts
    seo.ts
    form.ts         # or forms.ts — form provider and field config
    design.ts       # optional extended design tokens
    packages.ts     # optional tiered pricing
    portfolio.ts    # optional portfolio items
    faq.ts
    testimonials.ts
  layouts/
    BaseLayout.astro
    PageLayout.astro
  pages/
  styles/
    global.css
public/
  robots.txt
```

Existing components may live under `marketing/` until migrated to `sections/`. Prefer `sections/` for new page-level section components.

---

## Required Config Files

### Core (every website)

Create and maintain:

```txt
src/config/site.ts
src/config/company.ts
src/config/navigation.ts
src/config/services.ts
src/config/seo.ts
src/config/form.ts
```

These files should contain most business-specific information.

### Optional (richer websites)

Add when the input specification requires them:

```txt
src/config/design.ts      # extended design tokens beyond site.ts branding
src/config/packages.ts    # tiered service packages and pricing
src/config/portfolio.ts   # portfolio categories and items
src/config/content.ts     # shared section content and per-page copy blocks
src/config/faq.ts
src/config/testimonials.ts
src/config/pages.ts       # per-page section composition and metadata
```

### Config Responsibilities

#### `site.ts`

Site-level settings:

* Site name
* Site URL
* Default title template
* Default description
* Language and locale
* Author
* Default social/OG image
* Branding colors and preferred style (primary, secondary, accent, style descriptor)

#### `company.ts`

Business contact and positioning:

```ts
export const company = {
  name: string;
  tagline: string;
  positioning: string;       // e.g. "Growth Partner", "Full-Service Agency"
  email: string;
  phone: string;
  whatsapp?: string;         // optional — E.164 or wa.me-compatible number
  location: string;
  officeHours?: string;
  description: string;
};
```

#### `navigation.ts`

Primary navigation, secondary/footer links, and header CTA label/href.

#### `services.ts`

Service categories with name, description, benefits, slug, and optional image/icon.

#### `pages.ts`

Page visibility flags and per-page section enable/disable. Maps to NEW_WEBSITE_INPUT_SPEC "Pages Required" and page section toggles.

```ts
export const pagesConfig = {
  home: true,
  portfolio: false,
  // ...
  header: { sticky: true, ctaEnabled: true },
  messagingBubble: { enabled: false },
  sections: {
    home: { hero: true, impactStrip: true, pricingSelector: false, /* ... */ },
    about: { hero: true, process: true, phasedImplementation: false, /* ... */ },
    services: {
      pageHeader: true,
      serviceGrid: true,
      packageOverview: true,   // inline tier cards in ServiceGrid
      bundles: true,
      alaCarte: true,
      terminology: true,
      cta: true,
    },
    // portfolio, contact
  },
};
```

Section toggles for `bundles`, `alaCarte`, and `terminology` only render when enabled **and** the corresponding `packagesConfig` array has entries. Headings live in `content.ts` under `services.bundles`, `services.alaCarte`, `services.terminology`.

#### `content.ts`

Shared section content and per-page copy — outcomes, process steps, phased implementation, why choose us, capabilities, stats, and hero/CTA blocks for each page archetype. Populated from NEW_WEBSITE_INPUT_SPEC sections such as Outcome Cards, Process Steps, and Page Content Specification.

Hero blocks use `HeroContent`:

```ts
export interface HeroContent {
  heading: string;              // primary line — default heading colour
  headingHighlight?: string;    // optional second line — gold gradient (single h1)
  subheading?: string;
  paragraph?: string;
  // ...
}
```

Render with `HeroHeading.astro` — keeps one semantic `<h1>` for SEO while allowing two-tone display.

Services page header (and other interior pages using `PageHeader`) can use the same pattern via `content.ts`:

```ts
services: {
  pageHeader: {
    title: string;               // primary line — maps to PageHeader `heading`
    headingHighlight?: string;     // optional second line — gold gradient (single h1)
    intro?: string;                // intro paragraph below the title
  },
  // ...
}
```

Pass `headingHighlight` through `PageHeader` when set; omit for single-line titles (e.g. Privacy, FAQ).

#### `packages.ts` (optional)

Tiered pricing when the business offers plan levels. Also supports one-off bundles, à la carte line items, and terminology glossary entries.

**Services vs packages:** `services.ts` defines what you offer (descriptions, benefits). `packages.ts` defines how it is priced. Link tier groups to services via `serviceId` matching `services.ts` → `id`. Services without tiers omit an entry from `servicePackages`.

```ts
export type PackageTierIcon =
  | 'silver' | 'gold' | 'platinum' | 'star' | 'spark' | 'crown' | 'rocket' | 'shield';

export interface PackageTier {
  id: string;
  name: string;              // tier names defined in input spec — e.g. Starter, Pro, Enterprise
  price: string;
  period?: string;           // e.g. "pm", "once"
  description?: string;
  features: string[];
  icon?: PackageTierIcon;    // maps to designConfig.packages.tierIcons
}

export type PackageAccentPreset = 'accent' | 'highlight' | 'cyan';

export type ServicePackageAccent =
  | PackageAccentPreset
  | { color: string; glow?: string; border?: string };

export interface ServicePackages {
  serviceId: string;         // matches services.ts id
  serviceName: string;
  recommendedTierId?: string;  // featured/recommended tier for this service
  accent?: ServicePackageAccent; // per-service color for prices, checks, featured glow
  tiers: PackageTier[];
}

export interface BundlePackage {
  id: string;
  name: string;
  price: string;
  savingsMessage?: string;
  features: string[];
}

export interface AlaCarteItem { id?: string; item: string; price: string; }
export interface TerminologyEntry { term: string; definition: string; }
```

Config shape also includes `tierNames`, `tierSummaries` (home pricing selector), `servicePackages`, `bundles`, `alaCarte`, `terminology`, `getPackageInterestOptions()`, and `getAlaCarteInterestOptions()` for contact form selects.

**Services page rendering:** When `pagesConfig.sections.services.packageOverview` is enabled, `ServiceGrid` receives `packageGroups` from `servicePackages` and renders each tiered service as intro + tier cards (via `PackageTierCard`). Non-tiered services remain single cards. Separate `PackageOverview` remains available for split-layout use.

**Featured tier:** Set `recommendedTierId` on the service group. Badge label, border width, and glow are themed via `designConfig.packages.featuredTier`.

**Per-service accent:** Set `accent` to a preset (`accent`, `highlight`, `cyan`) or custom `{ color, glow?, border? }`. Scoped CSS variables are resolved in `src/utils/packageAccent.ts`.

Also support one-off packages (e.g. launch/starter packs) in `bundles[]` — separate from monthly tiers.

#### `portfolio.ts` (optional)

Config-driven portfolio listing and detail pages. Cards on `/portfolio` link to `/portfolio/[slug]`. Detail content is defined in the optional `detail` object on each item — no MDX required.

```ts
export interface PortfolioMediaImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface PortfolioMediaVideo {
  thumbnail: string;
  thumbnailAlt: string;
  url?: string;
  title?: string;
  caption?: string;
}

export interface PortfolioTestimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
}

export interface PortfolioDetailMeta {
  client?: string;
  services?: string[];
  year?: string;
}

export interface PortfolioDetail {
  summary?: string;
  meta?: PortfolioDetailMeta;
  testimonial?: PortfolioTestimonial;
  videos?: PortfolioMediaVideo[];
  images?: PortfolioMediaImage[];
}

export interface PortfolioItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  description: string;
  image: string;
  imageAlt: string;
  isVideo?: boolean;
  detail?: PortfolioDetail;
}

export interface PortfolioCategory {
  id: string;
  label: string;
}
```

Helpers: `getPortfolioItemBySlug()`, `getCategoryLabel()`, `getFeaturedItems()`.

Detail pages are generated statically via `src/pages/portfolio/[slug].astro` and `getStaticPaths()` from `portfolioConfig.items`.

#### `form.ts`

Provider-agnostic form configuration:

```ts
export type FormProvider = 'formsubmit' | 'formspree' | 'web3forms' | 'custom';

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'date';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface FormConfig {
  provider: FormProvider;
  endpoint: string;
  subject?: string;
  fields: FormField[];
  successMessage: string;
  errorMessage: string;
}
```

**FormSubmit (default):** set `provider: 'formsubmit'` and `endpoint` to the recipient email (typically the same as `company.ts` email). Optional env override: `PUBLIC_FORMSUBMIT_EMAIL`. First live submission triggers FormSubmit's one-time email confirmation.

**Web3Forms:** set `provider: 'web3forms'` and `endpoint` to the access key (`PUBLIC_WEB3FORMS_KEY`).

**Formspree:** set `provider: 'formspree'` and `endpoint` to the form ID or full URL.

**Custom:** set `provider: 'custom'` and `endpoint` to any POST URL (native form submit, no AJAX).

Field lists (service dropdowns, package interest, à la carte interest, consultation dates) must be driven from config, not hardcoded in components.

**Contact form pricing fields (when `packages.ts` is used):**

| Field | Source | Purpose |
| ----- | ------ | ------- |
| `serviceNeeded` | `services.ts` | Broad service category |
| `packageInterest` | tiers + bundles | Monthly tier or bundle plan |
| `alaCarteInterest` | `alaCarte[]` | Individual line-item pricing (optional; shown when `alaCarte.length > 0`) |

#### `design.ts` (optional)

Extended design tokens when `site.ts` branding is not sufficient:

* Set `enabled: true` for premium or dark-theme sites so tokens are injected into CSS variables
* Color palette (base, baseDeep, accent, text roles, border, surface)
* Gradients (hero, page, gold, accent, highlight, card, divider)
* Border radius scale
* Shadow scale (including gold button glow when applicable)
* Section spacing scale
* Container max widths
* Typography (display and body font stacks)
* **Package/tier presentation** (`packages.featuredTier`, `packages.tierIcons`) — recommended badge label, featured border/glow tokens, tier icon character map

When `design.ts` is not used, derive tokens from `site.ts` branding via CSS variables (see `src/utils/branding.ts` and `src/styles/global.css`).

Package tier UI classes (`.package-tier-group`, `.package-tier-card--featured`, `.package-tier-badge`) live in `global.css` and consume `--pkg-accent*` variables set per service group.

Gradients defined in `design.ts` are exported as CSS custom properties by `brandStyleAttribute()` and applied in `global.css` — not by hardcoding colors in components.

#### `seo.ts`

Per-page titles, descriptions, keywords, and schema configuration.

---

## Required Pages

Every generated website should support:

* Home
* About
* Services
* Contact
* Privacy Policy
* Terms of Service

Optional:

* FAQ
* Pricing
* Portfolio
* Blog
* Team
* Testimonials
* Case Studies

---

## Page Composition Patterns

Pages are assembled from reusable section components. Section order and visibility are defined in config or page files — not hardcoded business copy.

### Home Page Archetype

Typical section flow for conversion-focused landing pages:

| Section | Component pattern | Purpose |
| ------- | ----------------- | ------- |
| Hero | Two-column hero with headline, supporting copy, CTAs, and media | Immediate value proposition |
| Impact strip | Horizontal row of 3–4 outcome cards | Quick trust and benefit summary |
| Services preview | Card grid of top service categories | Orient visitor to offerings |
| Pricing selector | Tier pills or cards without full pricing tables | Introduce plan levels; drive consultation |
| Consultation CTA | Strong copy, imagery, optional booking mockup | Primary conversion point |
| Featured work | Limited portfolio preview (3–6 items) | Social proof and capability |
| Testimonials | Optional quote cards | Trust building |

Visual balance: more imagery, less text, generous whitespace, strong emotional impact.

### About Page Archetype

Typical section flow for information-focused pages:

| Section | Component pattern | Purpose |
| ------- | ----------------- | ------- |
| About hero | Headline, positioning statement, single strong image | Set context |
| Intro | What the business does — concise paragraph | Clarify scope |
| Services icon row | Single clean row of capabilities | Scan-friendly overview |
| Process | 3–4 step growth or delivery process | Explain how the business works |
| Why choose us | Two-column text-first layout with bullets | Differentiation |
| Phased implementation | Optional phase cards (Foundation → Momentum → Scale) | Flexibility messaging |
| CTA | Consultation or contact prompt | Conversion |

Visual balance: more information, fewer visuals, clear hierarchy, avoid crowded blocks.

### Portfolio Page Archetype

| Section | Component pattern | Purpose |
| ------- | ----------------- | ------- |
| Portfolio hero | Headline, description, large media placeholder | Set expectations |
| Category filters | Static or lightly interactive filter buttons | Browse by work type |
| Portfolio grid | Cards with image, category, title, description, play icon for video; each card links to `/portfolio/[slug]` | Showcase work |
| Stats strip | Placeholder metrics only unless real data supplied | Optional social proof |
| CTA | Consultation or services link | Conversion |

Filters can be static initially. Use minimal JavaScript only if required.

Do not invent guaranteed results in stats. Use placeholders or real data from config.

### Portfolio Detail Page Archetype

Route: `/portfolio/[slug]` — one static page per item in `portfolioConfig.items`.

| Section | Component pattern | Purpose |
| ------- | ----------------- | ------- |
| Back link | Text link to `/portfolio` using `portfolioConfig.pageTitle` | Easy return to listing |
| Hero | Category label, title, summary, optional meta (client, year, services), lead image | Project context |
| Videos | `VideoPlaceholder` grid when `detail.videos[]` is set | Showcase video deliverables |
| Gallery | Image grid with captions when `detail.images[]` is set | Photography and stills |
| Testimonial | Single quote block when `detail.testimonial` is set | Social proof |
| CTA | Primary contact action + secondary link back to `/portfolio` | Conversion |

Per-item SEO title and description are derived from the item title and `detail.summary` (or card `description`).

### Contact Page Archetype

| Section | Component pattern | Purpose |
| ------- | ----------------- | ------- |
| Contact hero | Headline, invitation copy, supporting image | Welcome and orient |
| Contact form | Config-driven fields, accessible labels, provider-agnostic endpoint | Primary enquiry channel |
| Booking mockup | Static calendar with time slots (optional) | Visual booking intent before live integration |
| Contact info cards | Phone, email, messaging app, hours, location | Alternative contact paths |
| FAQ | Common questions from config | Reduce friction |
| CTA | Repeat primary action | Conversion |

### Services Page Archetype

| Section | Component pattern | Purpose |
| ------- | ----------------- | ------- |
| Page header | Title, optional highlight, and intro | Context |
| Service grid | Full service list; tiered services include inline tier cards when `packageOverview` enabled | Detail offerings + pricing |
| Bundle packages | One-off / bundle cards (optional) | Fixed-price packages |
| À la carte pricing | Item/price list (optional) | Individual deliverable pricing |
| Terminology | Glossary grid (optional) | Explain package terms |
| CTA | Contact or consultation | Conversion |

When `packageOverview` is enabled, `ServiceGrid` merges `services.ts` with `packages.ts` `servicePackages` by `serviceId`. Use `PackageOverview` only when a separate tier summary section is needed.

---

## Global Layout Requirements

### Header

Support via layout components and navigation config:

* Sticky header
* Logo linked to home
* Primary navigation links
* Optional header CTA button (e.g. "Book Consultation", "Get Started")
* Mobile hamburger navigation
* Background and active-state styling from design tokens

### Footer

* Logo and short brand statement from config
* Navigation and service links
* Contact details
* Social media links (when provided)
* Optional messaging app CTA
* Copyright
* Privacy Policy and Terms of Service links

### Floating Contact Bubble (optional)

When the input specification includes a messaging app (e.g. WhatsApp):

* Fixed bottom-right position
* Visible on all pages
* Accessible label from config
* Must not block form buttons on mobile
* Link URL from `company.ts`

Component: `utility/MessagingBubble.astro` or similar — generic, not provider-specific in name.

---

## Required Components

Create reusable components organized by category.

### Layout

* `Header`
* `Footer`
* `Navigation`
* `MobileNavigation`
* `BaseLayout`
* `PageLayout`

### Section Components

Page-level sections — prefer one component per distinct section pattern:

* `Hero` / `HomeHero` / `AboutHero` / `PortfolioHero` / `ContactHero` — hero variants sharing a common prop interface where possible
* `ImpactStrip` — horizontal outcome or benefit cards
* `ServicesPreview` — condensed service card grid
* `ServiceGrid` — full service listing; optional `packageGroups` for inline tier cards
* `PackageTierCard` — single tier card (icon, price, features, optional recommended badge)
* `PackageOverview` — standalone tier summary rows per service category
* `BundlePackages` — one-off / bundle package cards
* `AlaCartePricing` — individual line-item pricing list
* `PricingTerminology` — package terminology glossary
* `FeatureGrid` — feature or capability grid
* `PricingSelector` — tier pills or cards without full pricing tables
* `CTASection` / `ConsultationCTA` — conversion sections with optional booking mockup
* `FeaturedWork` — limited portfolio preview
* `AboutIntro` — informational text block
* `ServicesIconRow` — compact capability row
* `ProcessSteps` / `GrowthProcess` — numbered step sequence
* `WhyChooseUs` — two-column differentiation section
* `PhasedImplementation` — optional phase cards
* `PortfolioGallery` — filterable portfolio grid
* `PortfolioDetail` — portfolio item detail page (hero, videos, images, testimonial)
* `StatsStrip` — metric placeholders or real stats from config
* `TestimonialSection`
* `FAQSection`

### UI Primitives

* `Button`
* `Card`
* `Badge`
* `HeroHeading` — two-line hero title with optional gold gradient highlight (single `<h1>`)
* `Container`
* `Section` / `SectionWrapper`
* `SectionHeading`
* `IconCard`
* `Pill`
* `Divider`

### Media

* `VideoPlaceholder` — rounded media block with play button and optional embed URL
* `ImageCard`
* `PortfolioCard` — portfolio item card; links to `/portfolio/[slug]`; category label, title, description, optional play icon
* `PlayButton`

### Forms

* `ContactForm` — renders fields from form config
* `FormField`
* `SelectField`
* `TextAreaField`
* `BookingCalendarMockup` — static calendar and time-slot selector

### Utility

* `SEO` — meta tags, Open Graph, Twitter cards
* `Schema` — JSON-LD structured data
* `PageHeader` — interior page title block; optional `headingHighlight` via `HeroHeading` (same two-tone pattern as hero pages)
* `Breadcrumbs`
* `MessagingBubble` — optional floating contact button

---

## Design System

Create reusable design tokens. Avoid hardcoded color, spacing, and radius values in components.

### Token Pipeline

1. **`site.ts` branding** — primary, secondary, accent, theme mode, neutral text/background roles
2. **`design.ts`** (optional, set `enabled: true` for dark/premium sites) — extended palette, gradients, shadows, typography
3. **`branding.ts`** — maps config to CSS custom properties on `<html>` via `brandStyleAttribute()`
4. **`global.css`** — semantic utility classes and theme-aware component rules that consume those variables

Components must use semantic classes (below) or CSS variables — **not** Tailwind neutral scale classes such as `text-neutral-600` or `bg-white`, which assume a light background and break on dark themes.

### Token Sources

1. **`site.ts` branding** — primary, secondary, accent colors injected as CSS variables via `brandStyleAttribute()`
2. **`global.css` `@theme`** — typography scale, spacing, radius, shadows; semantic component classes
3. **`design.ts`** (optional) — extended palette, gradients, and style presets for premium or dark-theme sites

### Colors

Required semantic roles in config:

* Primary, secondary, accent
* Text: `text` (headings), `textSoft` (body), `textMuted` (secondary), `textSubtle` (captions/fine print)
* Background: `base`, `baseDeep`, surface tokens
* Border

Support both light and dark base themes depending on input specification. Set `site.ts` → `branding.themeMode` to `light`, `dark`, or `auto`. For dark-theme sites, enable `design.ts` and use semantic classes in components.

Example token structure for `design.ts`:

```ts
export const designConfig = {
  enabled: true,
  colors: {
    base: '#061426',
    baseDeep: '#050A18',
    accent: '#D9A441',
    accentLight: '#F2C766',
    highlight: '#1EA7FF',
    text: '#FFFFFF',
    textSoft: '#E2E8F0',      // body copy — aim for WCAG AA on base background
    textMuted: '#B8C5D6',    // labels, secondary info
    textSubtle: '#94A3B8',   // captions, legal fine print only
    border: 'rgba(217, 164, 65, 0.22)',
    surface: 'rgba(255, 255, 255, 0.04)',
    surfaceRaised: 'rgba(255, 255, 255, 0.07)',
    inputBg: 'rgba(2, 8, 20, 0.65)',
  },
  gradients: {
    hero: 'linear-gradient(135deg, #020814 0%, #061426 100%)',
    page: '...',              // radial spotlight + deep base (body background)
    gold: 'linear-gradient(135deg, #D9A441 0%, #F2C766 100%)',
    accent: '...',            // metallic CTA gradient (buttons)
    highlight: 'linear-gradient(135deg, #1EA7FF 0%, #061426 100%)',
    card: '...',              // card/panel surface
    divider: '...',           // horizontal gold fade
  },
  // typography, spacing, radius, shadows ...
};
```

### Semantic Theme Classes

Use these in components instead of hardcoded Tailwind neutrals. They resolve correctly in both light and dark themes via CSS variables.

| Class | Use for |
| ----- | ------- |
| `text-fg` | Headings, emphasis text |
| `text-fg-soft` | Body copy, list items, descriptions |
| `text-fg-muted` | Labels, secondary info, captions on cards |
| `text-fg-subtle` | Fine print, legal text, form hints |
| `text-fg-label` | Form field labels |
| `text-gradient-gold` | Gold gradient emphasis on hero second line or keywords |
| `surface-card` | Cards, panels, form containers |
| `surface-panel` | Section sub-backgrounds, booking mockup wrapper |
| `section-hero` | Hero sections (applies hero gradient + overlay) |
| `section-surface` | Standard content sections on dark sites |
| `btn-accent` | Primary gold CTA buttons (metallic gradient) |
| `filter-pill` | Portfolio category filters |
| `header-glass` | Sticky header with blur and gold edge |

Form inputs inherit dark-theme styling from `global.css` base rules when using standard `input`, `select`, and `textarea` elements — no per-component color overrides needed.

Legacy `text-neutral-*` and `bg-white` classes are remapped in dark theme as a safety net, but **new code must not use them**.

### Gradients

Define in `design.ts`. Export via `branding.ts` as `--gradient-*` CSS variables. Apply in `global.css` component rules — not as inline styles in components.

Common gradient roles:

* **Hero** — section hero background (base to deep base)
* **Page** — body backdrop with optional radial spotlight
* **Gold / Accent** — CTA buttons and gold emphasis
* **Highlight** — stats strips, CTA bands (accent to base)
* **Card** — elevated panel surface
* **Divider / Edge** — horizontal gold fade between sections

Avoid flat, harsh backgrounds on premium layouts.

### Typography

* Heading scale (display, h1–h4)
* Body scale
* Small text scale
* Display font and body font — use system fonts first; add external fonts only when specified

### Spacing

Consistent section spacing with responsive reduction on mobile:

* Section padding: generous on desktop, reduced on tablet and mobile
* Card padding: consistent internal spacing
* Container max width: typically `max-w-7xl` or equivalent token

Do not crowd sections. Prefer fewer blocks with more whitespace on landing pages.

### Border Radius

Use a consistent radius scale:

* Small cards: `rounded-2xl` or `--radius-card`
* Large media blocks: `rounded-3xl`
* Buttons: `rounded-full` or `rounded-xl`

Apply to cards, media blocks, buttons, forms, and image containers.

### Shadows and Effects

* Card shadow token (`--shadow-card`)
* Elevated shadow token for hover or featured elements (`--shadow-elevated`)
* Gold button glow (`--shadow-gold-button`) when design direction calls for metallic CTAs
* Subtle gradient overlays on hero and page backgrounds for premium dark layouts

### Component Style Presets

Map to semantic classes above:

* **Primary CTA** — `btn-accent` (gold gradient)
* **Secondary / outline** — `Button` variant `outline` (uses accent border tokens)
* **Cards** — `surface-card` via `Card.astro` or direct class
* **Badges** — token-based variants in `Badge.astro` (`text-fg`, `text-accent`)
* **Pills / tier selectors** — `Pill.astro` (`surface-card` inactive, `btn-accent` active)
* **Section backgrounds** — `section-hero`, `section-surface`, `surface-panel`

### Visual Balance by Page Type

| Page type | Visual emphasis |
| --------- | --------------- |
| Home | More visuals, less text, emotional impact, strong CTAs |
| About | More information, fewer visuals, clear hierarchy |
| Portfolio | Work showcase, category filters, card grid linking to detail pages |
| Contact | Form-first, easy communication paths, minimal distraction |
| Services | Structured detail, scannable benefits, optional pricing |

---

## Images

Store images under either location depending on how they are referenced in config:

```txt
src/assets/          # preferred for Astro-optimized imports
  brand/
  images/
  gallery/

public/              # acceptable for config-driven string paths (e.g. /images/hero.svg)
  images/
  gallery/
  logo.svg
  favicon.svg
```

Requirements:

* Responsive images
* Astro image optimization when using `src/assets/` with `astro:assets`
* Config string paths (in `content.ts`, `services.ts`, `portfolio.ts`) may point to `public/` (e.g. `/images/video-placeholder.svg`)
* Appropriate dimensions
* Modern formats where practical
* Descriptive alt text
* Avoid oversized assets

Image categories to support (paths and filenames from input spec):

* Logo assets (standard and inverse/light variants)
* Hero and background imagery
* Service and capability visuals
* Team and founder photos (when provided)
* Portfolio items
* Video placeholder thumbnails

Fallback rule: if final images do not exist, use SVG or JPG placeholders with descriptive alt text and comments so assets can be replaced later without code changes. Placeholders may live in `public/images/` during initial build even when the spec lists `src/assets/` paths — update config paths when final assets are added.

---

## Forms

Forms must be provider agnostic.

Do not hardcode a specific form provider.

Allow configuration for:

* FormSubmit (default — email to inbox, no signup)
* Formspree
* Web3Forms
* Email API
* Custom endpoint

Form requirements:

* Accessible labels
* Required field indicators
* Helpful placeholder text
* Error-message-ready structure
* Success-message-ready structure
* Field definitions driven from `form.ts` config
* Spam protection placeholder for future integration

Do not require a backend database.

Booking calendars and consultation schedulers can remain static mockups until a live provider is specified in the input specification.

---

## SEO Requirements

Every page must include:

* Title
* Meta description
* Canonical URL
* Open Graph metadata
* Twitter metadata
* Proper heading hierarchy
* Semantic HTML

Generate:

* sitemap.xml
* robots.txt

Recommended structured data (via `Schema.astro`):

* `LocalBusiness` or `Organization`
* `WebSite`
* `FAQPage` where FAQs appear
* `BreadcrumbList` where breadcrumbs appear

Page-level SEO metadata lives in `seo.ts` or per-page frontmatter — populated from the input specification.

Avoid keyword stuffing.

---

## Accessibility Requirements

Follow WCAG guidelines.

Requirements:

* Keyboard navigation
* Alt text for images
* Semantic HTML
* Accessible form labels
* Proper heading structure
* Sufficient contrast
* Visible focus states
* Accessible navigation and mobile menu
* Accessible labels on floating contact buttons

Accessibility is mandatory.

---

## Performance Standards

Target:

* Lighthouse Performance 90+
* Lighthouse SEO 95+
* Lighthouse Accessibility 95+

Performance rules:

* Minimize JavaScript
* Avoid unnecessary client hydration
* Prefer Astro islands only when needed
* Optimize images
* Lazy-load non-critical images
* Keep animations subtle and lightweight
* Avoid heavy third-party scripts unless explicitly requested

---

## Responsive and Interaction Requirements

### Responsive Layout

| Breakpoint | Patterns |
| ---------- | -------- |
| Desktop | Wide sections, two-column heroes, 3–4 column card grids |
| Tablet | Two-column grids, stacked heroes where needed |
| Mobile | Single-column layout, large tappable buttons, safe positioning for floating contact buttons |

### Interaction

* Smooth scrolling for anchor links
* Button and card hover states from design tokens
* Portfolio filters: static initially; lightweight client script only when needed
* Booking calendar: static mockup until a provider is integrated
* Messaging app links must work when configured

---

## Cloudflare Pages Compatibility

Generated websites must:

* Build successfully using Astro static output
* Work on Cloudflare Pages
* Require no server runtime
* Require no database
* Require no custom infrastructure

Recommended build command: `npm run build`

Recommended output directory: `dist`

---

## AI Agent Rules

Before creating new code:

1. Reuse existing components.
2. Reuse design tokens and semantic theme classes (`text-fg-soft`, `surface-card`, etc.).
3. Reuse layouts.
4. Reuse configuration files.
5. Check whether content should live in config before hardcoding it.
6. Read the website input specification for business-specific values.
7. Do not use `text-neutral-*` or `bg-white` in components — use semantic classes instead.

When adding functionality:

1. Prefer extension over replacement.
2. Keep architecture consistent.
3. Keep code simple.
4. Keep code strongly typed.
5. Use reusable components.
6. Add comments where future edits are likely.
7. Keep platform rules generic — client content belongs in config.

Do not introduce:

* React
* Vue
* Angular
* Svelte
* Server-side rendering
* Databases
* Backend dependencies

unless explicitly requested.

### Build Workflow for a New Website

1. Keep the existing Astro architecture.
2. Add or extend configuration files from the input specification.
3. Build pages by composing section components — create components before page-specific markup.
4. Apply branding via config and design tokens — not hardcoded in components.
5. Add optional features (portfolio, packages, messaging bubble, booking mockup) only when the input spec requires them.
6. Use static generation only.
7. Ensure the site is responsive, accessible, and SEO ready.

---

## Copy and Tone Guidelines

Copy comes from the website input specification, not from this document.

When writing or placing copy:

* Match the tone defined in the input spec (e.g. professional, premium, approachable)
* Focus on outcomes and partnership value
* Do not overpromise guaranteed results
* Prefer language about systems, measurable growth, and flexible implementation
* Use tier and package names exactly as defined in the input spec

---

## Success Criteria

A complete new website should be launchable by changing only:

* Company information
* Branding and design tokens
* Content and copy
* Images
* Services and packages
* Navigation and CTAs
* Form configuration
* SEO metadata

without requiring architectural changes.

The platform remains reusable when:

* Components are generic and config-driven
* No client-specific logic is embedded in shared components
* New websites can adopt different page sets, section orders, and design directions through config and composition
* Each site repo (or future monorepo subfolder) is self-contained and maps cleanly from a template clone
* The site builds statically with Astro
* Lighthouse targets are achievable
