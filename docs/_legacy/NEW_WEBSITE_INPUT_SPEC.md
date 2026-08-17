> **ARCHIVED.** Use `docs/AGENT.md`, `docs/PLATFORM.md`, and `docs/SITE_SPEC.*` for new work. See `docs/_legacy/README.md`.

# NEW_WEBSITE_INPUT_SPEC.md

## Purpose

When generating a new website from this template, use this document as the **single source of truth for business content**.

Populate pages, copy, branding, navigation, services, pricing, portfolio, forms, images, CTAs, and SEO from this specification.

| Document | Role |
| -------- | ---- |
| `AI_TEMPLATE_RULES.md` | Platform architecture, components, and design system |
| `AI_QUICK_RULES.md` | Compact always-on constraints and workflow |
| `NEW_WEBSITE_INPUT_SPEC.md` | Per-website content — fill in and duplicate for each client |

Do not put platform architecture or component implementation details in this file. Follow `AI_TEMPLATE_RULES.md` when building.

To create a client-specific spec (e.g. `TheWellMediaHouseWebsiteInputSpec.md`), copy this template, replace all placeholders, and remove unused optional sections.

### Repository workflow

Each new client site should live in a **dedicated repository** cloned from the template on `main`. The Well Media House is the exception — it is maintained on the `wellmedia` branch in the template repo as the sole co-located reference site.

Keep all business content in this spec and in `src/config/` so the site can move into a monorepo subfolder later with minimal restructuring.

---

# Website Information

## Company Name

{{company_name}}

## Website URL

{{website_url}}

## Industry

{{industry}}

## Positioning Statement

How the business should be described in one line (e.g. "Business Growth Partner", "Full-Service Digital Agency").

{{positioning_statement}}

## Tagline

{{tagline}}

## Supporting Taglines

Optional alternate headlines or sub-taglines for heroes, CTAs, and marketing sections.

* {{supporting_tagline_1}}
* {{supporting_tagline_2}}
* {{supporting_tagline_3}}

## Short Description

One or two sentences for meta descriptions, footer, and intro blocks.

{{short_description}}

## Long Description

Full company overview for About page, schema, and extended copy.

{{long_description}}

## Language and Locale

* Language: {{language}} (e.g. `en`)
* Locale: {{locale}} (e.g. `en-ZA`)

---

# Branding

## Primary Color

Name and hex.

{{primary_color_name}} — `{{primary_color_hex}}`

## Secondary Color

{{secondary_color_name}} — `{{secondary_color_hex}}`

## Accent Color

{{accent_color_name}} — `{{accent_color_hex}}`

## Additional Accent Color

Optional second highlight (e.g. for glow, links, or media-tech accents).

{{additional_accent_name}} — `{{additional_accent_hex}}`

## Neutral Colors

Define when using a dark theme, light theme, or custom palette:

* Text primary: `{{text_primary_hex}}`
* Text soft (body copy): `{{text_soft_hex}}` — main paragraph text; ensure WCAG AA contrast on background
* Text muted: `{{text_muted_hex}}` — labels, secondary info
* Text subtle: `{{text_subtle_hex}}` — captions, fine print only
* Background: `{{background_hex}}`
* Background deep: `{{background_deep_hex}}`
* Border: `{{border_color}}`

## Preferred Style

Examples: Corporate, Modern, Minimalist, Luxury, Creative, Technical, Cinematic, Premium

{{preferred_style}}

## Theme Mode

* Light
* Dark
* Auto (follow system)

Selected: {{theme_mode}}

For **dark** or **premium** sites: set `themeMode: 'dark'` in `site.ts` and set `enabled: true` in `design.ts` so extended tokens (gradients, text roles, shadows) are applied. Components use semantic theme classes (`text-fg-soft`, `surface-card`, etc.) — see `AI_TEMPLATE_RULES.md`.

## Design Rules

Visual direction for this website. Be specific about spacing, imagery, and tone.

* {{design_rule_1}}
* {{design_rule_2}}
* {{design_rule_3}}

Examples:

* Use generous padding between sections; avoid overcrowding pages.
* Use fewer visual blocks on the About page.
* Use rounded corners on cards, media blocks, buttons, and forms.
* Use subtle gradients, not busy backgrounds.
* Prefer real photography over excessive iconography.

## Extended Design Tokens

Optional. Use when basic branding colors are not enough. Maps to `src/config/design.ts`. Set `enabled: true` when using this section.

### Gradients

* Hero: `{{gradient_hero}}`
* Page (body backdrop): `{{gradient_page}}`
* Gold: `{{gradient_gold}}`
* Accent (CTA buttons): `{{gradient_accent}}`
* Highlight: `{{gradient_highlight}}`
* Cyan (optional): `{{gradient_cyan}}`
* Card surface: `{{gradient_card}}`
* Divider / edge fade: `{{gradient_divider}}`

### Typography

* Display / heading font: {{heading_font}}
* Body font: {{body_font}}

### Spacing and Layout

* Section padding (desktop / tablet / mobile): {{section_padding}}
* Container max width: {{container_max_width}}
* Card border radius: {{card_radius}}
* Button border radius: {{button_radius}}

### Package / Tier Presentation (optional)

Maps to `designConfig.packages` when tiered pricing is used.

* Featured tier badge label: {{featured_tier_badge_label}} (e.g. "Recommended")
* Featured tier border width: {{featured_tier_border_width}} (e.g. "2px")
* Featured tier glow size / opacity: {{featured_tier_glow_size}} / {{featured_tier_glow_opacity}}
* Tier icon characters (keys → glyph): silver, gold, platinum, star, spark, crown, rocket, shield

Per-service accent colors and recommended tier IDs are set in `packages.ts` → `servicePackages[]`, not in `design.ts`.

---

# Contact Information

## Email

{{email}}

## Phone

{{phone}}

## Messaging App

Optional. Used for floating contact bubble and form fields.

* Provider: {{messaging_provider}} (e.g. WhatsApp, Telegram — or "None")
* Link: {{messaging_link}} (e.g. `https://wa.me/1234567890`)
* Display label: {{messaging_label}} (e.g. "Chat on WhatsApp")
* Accessible button label: {{messaging_aria_label}}

## Address

{{address}}

## Office Hours

{{office_hours}}

## Footer Brand Statement

Short line for footer (1–2 sentences).

{{footer_brand_statement}}

---

# Social Links

Provide URLs or "Not required" / "To be added".

* LinkedIn: {{linkedin}}
* Facebook: {{facebook}}
* Instagram: {{instagram}}
* X: {{twitter}}
* YouTube: {{youtube}}
* TikTok: {{tiktok}}
* Other: {{other_social}}

---

# Navigation

## Header Navigation

Primary links in order:

* {{nav_item_1}}
* {{nav_item_2}}
* {{nav_item_3}}
* {{nav_item_4}}

## Header CTA

* Label: {{header_cta_label}} (e.g. "Book Consultation", "Get Started")
* Link: {{header_cta_href}} (e.g. `/contact`)

## Footer Navigation

* {{footer_nav_item_1}}
* {{footer_nav_item_2}}
* {{footer_nav_item_3}}
* {{footer_nav_item_4}}
* Privacy Policy
* Terms of Service

## Footer Service Links

Optional quick links to key services (pulled from Services section or listed here):

* {{footer_service_1}}
* {{footer_service_2}}
* {{footer_service_3}}

---

# Global Website Content

Content requirements for site-wide elements. Implementation follows `AI_TEMPLATE_RULES.md`.

## Header

* Sticky: {{header_sticky}} (yes / no)
* Logo variant: {{header_logo_variant}} (standard / white / dark)
* Header CTA enabled: {{header_cta_enabled}} (yes / no)
* Notes: {{header_notes}}

## Floating Messaging Bubble

Enable when a messaging app is configured above.

* Enabled: {{messaging_bubble_enabled}} (yes / no)
* Position: bottom-right
* Visible on all pages: yes

## Footer

Must include:

* Logo
* Footer brand statement (see Contact Information)
* Footer navigation links
* Footer service links (if applicable)
* Contact details (email, phone, messaging app)
* Social links (when provided)
* Copyright: © {{year}} {{company_name}}. All rights reserved.

---

# Services

Define each service category. Repeat blocks as needed. Maps to `src/config/services.ts`.

## Service Template

Use this structure for each service:

### Service {{n}}

* **Name:** {{service_name}}
* **Slug:** {{service_slug}} (e.g. `content-creation`)
* **Short description:** {{service_short_description}} (1–2 sentences for cards)
* **Full description:** {{service_full_description}}
* **Image:** {{service_image_path}} (optional)
* **Icon:** {{service_icon}} (optional)

**Benefits:**

* {{benefit_1}}
* {{benefit_2}}
* {{benefit_3}}

---

## Service 1

Name:

Description:

Benefits:

* 
* 
* 

---

## Service 2

Name:

Description:

Benefits:

* 
* 
* 

---

## Service 3

Name:

Description:

Benefits:

* 
* 
* 

---

# Packages and Pricing

Optional. Use when the business offers tiered plans or bundled packages. Maps to `src/config/packages.ts`.

## Tier Naming Convention

Define the plan level names used across the entire website. Use consistently everywhere — selectors, forms, and pricing tables.

* Tier 1: {{tier_1_name}} (e.g. Starter, Silver, Basic)
* Tier 2: {{tier_2_name}} (e.g. Pro, Gold, Standard)
* Tier 3: {{tier_3_name}} (e.g. Enterprise, Platinum, Premium)

## Tier Summaries

Short labels for home page pricing selector (optional):

| Tier | Label | Tagline |
| ---- | ----- | ------- |
| {{tier_1_name}} | {{tier_1_label}} | {{tier_1_tagline}} |
| {{tier_2_name}} | {{tier_2_label}} | {{tier_2_tagline}} |
| {{tier_3_name}} | {{tier_3_label}} | {{tier_3_tagline}} |

Pricing selector note (shown below tiers):

{{pricing_selector_note}} (e.g. "Not sure what you need? Book a consultation and we'll guide you.")

## Service Package Groups

Repeat for each service category that has tiered pricing.

### Package Group: {{service_name}}

* **Service ID:** {{service_id}} — must match `services.ts` → `id`
* **Recommended tier ID (optional):** {{recommended_tier_id}} — e.g. `content-gold`
* **Accent (optional):** {{service_accent}} — preset (`accent`, `highlight`, `cyan`) or custom hex for prices, checks, and featured tier glow

#### {{tier_1_name}} — {{price}} {{period}}

* **Tier ID:** {{tier_1_id}}
* **Icon (optional):** {{tier_1_icon}} — key from `designConfig.packages.tierIcons`
* {{feature_1}}
* {{feature_2}}
* {{feature_3}}

#### {{tier_2_name}} — {{price}} {{period}}

* **Tier ID:** {{tier_2_id}}
* **Icon (optional):** {{tier_2_icon}}
* {{feature_1}}
* {{feature_2}}
* {{feature_3}}

#### {{tier_3_name}} — {{price}} {{period}}

* **Tier ID:** {{tier_3_id}}
* **Icon (optional):** {{tier_3_icon}}
* {{feature_1}}
* {{feature_2}}
* {{feature_3}}

---

## One-Off / Bundle Packages

Standalone packages not tied to monthly tiers (e.g. launch packs, starter bundles).

### {{bundle_name}} — {{price}}

* Savings message (optional): {{savings_message}}
* {{included_item_1}}
* {{included_item_2}}
* {{included_item_3}}

---

## Individual / À La Carte Items

Optional list pricing for individual deliverables.

| Item | Price |
| ---- | ----- |
| {{item_1}} | {{price_1}} |
| {{item_2}} | {{price_2}} |
| {{item_3}} | {{price_3}} |

---

## Terminology Definitions

Optional glossary for industry-specific deliverable types (e.g. video tiers, service levels).

### {{term_1_name}}

{{term_1_definition}}

### {{term_2_name}}

{{term_2_definition}}

---

# Outcome Cards

Optional. Used for home page impact strip and similar sections.

| Title | Description |
| ----- | ----------- |
| {{outcome_1_title}} | {{outcome_1_description}} |
| {{outcome_2_title}} | {{outcome_2_description}} |
| {{outcome_3_title}} | {{outcome_3_description}} |
| {{outcome_4_title}} | {{outcome_4_description}} |

---

# Process Steps

Optional. Used for About page and similar sections. Typically 3–4 steps.

| Step | Title | Description |
| ---- | ----- | ----------- |
| 1 | {{step_1_title}} | {{step_1_description}} |
| 2 | {{step_2_title}} | {{step_2_description}} |
| 3 | {{step_3_title}} | {{step_3_description}} |
| 4 | {{step_4_title}} | {{step_4_description}} |

---

# Phased Implementation

Optional. Communicates that work can be staged over time.

Intro paragraph:

{{phased_implementation_intro}}

| Phase | Title | Description |
| ----- | ----- | ----------- |
| 1 | {{phase_1_title}} | {{phase_1_description}} |
| 2 | {{phase_2_title}} | {{phase_2_description}} |
| 3 | {{phase_3_title}} | {{phase_3_description}} |

---

# Why Choose Us

Optional differentiation block (typically About page).

* **Heading:** {{why_choose_heading}}
* **Paragraph:** {{why_choose_paragraph}}

**Bullets:**

* {{why_choose_bullet_1}}
* {{why_choose_bullet_2}}
* {{why_choose_bullet_3}}
* {{why_choose_bullet_4}}

---

# Capabilities Row

Optional compact list for About page icon/text row (one line per capability).

* {{capability_1}}
* {{capability_2}}
* {{capability_3}}
* {{capability_4}}
* {{capability_5}}

---

# Portfolio

Optional. Maps to `src/config/portfolio.ts`.

## Portfolio Page Title

{{portfolio_page_title}} (e.g. "Our Work", "Portfolio")

## Categories

Define filter categories. Always include "All" as the default filter in implementation.

* {{category_1}}
* {{category_2}}
* {{category_3}}
* {{category_4}}

## Portfolio Items

Each item appears as a card on `/portfolio` and has a detail page at `/portfolio/[slug]`. Populate the card fields plus an optional `detail` object in `portfolio.ts`.

Repeat for each item:

### Item {{n}}

* **Slug:** {{item_slug}} (URL segment, e.g. `brand-film` → `/portfolio/brand-film`)
* **Title:** {{item_title}}
* **Category:** {{item_category}} (must match a category id)
* **Description:** {{item_description}} (card teaser)
* **Image:** {{item_image_path}}
* **Image alt:** {{item_image_alt}}
* **Is video:** {{is_video}} (yes / no — shows play icon on card)

#### Detail page (optional)

* **Summary:** {{item_summary}} (longer intro on detail page; falls back to description)
* **Client:** {{item_client}} (optional)
* **Services:** {{item_services}} (optional, comma-separated)
* **Year:** {{item_year}} (optional)

**Videos** (repeat as needed):

* Thumbnail, alt, title, caption, optional external URL

**Images** (repeat as needed):

* Source path, alt, optional caption

**Testimonial** (optional):

* Quote, author, role, company

---

# Featured Work Preview

Optional subset of portfolio items for the home page (typically 3–6 items). Each card can link to a detail page by setting `slug` to match a portfolio item slug.

* {{featured_1_title}} — {{featured_1_category}} → slug: {{featured_1_slug}}
* {{featured_2_title}} — {{featured_2_category}} → slug: {{featured_2_slug}}
* {{featured_3_title}} — {{featured_3_category}} → slug: {{featured_3_slug}}
* {{featured_4_title}} — {{featured_4_category}} → slug: {{featured_4_slug}}
* {{featured_5_title}} — {{featured_5_category}} → slug: {{featured_5_slug}}

---

# Stats Strip

Optional social proof metrics for portfolio or home page.

Use real data when available. Use clearly labelled placeholders when not.

| Label | Value | Notes |
| ----- | ----- | ----- |
| {{stat_1_label}} | {{stat_1_value}} | {{stat_1_note}} |
| {{stat_2_label}} | {{stat_2_value}} | {{stat_2_note}} |
| {{stat_3_label}} | {{stat_3_value}} | {{stat_3_note}} |
| {{stat_4_label}} | {{stat_4_value}} | {{stat_4_note}} |

Do not invent guaranteed results. Mark placeholders explicitly (e.g. "Placeholder — replace with verified data").

---

# Target Audience

Describe ideal customers.

{{target_audience}}

---

# Key Differentiators

List what makes the business unique.

* {{differentiator_1}}
* {{differentiator_2}}
* {{differentiator_3}}
* {{differentiator_4}}

---

# Testimonials

Optional. Maps to `src/config/testimonials.ts`.

## Testimonial {{n}}

* **Quote:** {{testimonial_quote}}
* **Author:** {{testimonial_author}}
* **Role / Company:** {{testimonial_role}}
* **Avatar path:** {{testimonial_avatar}} (optional — public path, e.g. `/images/testimonials/name.webp`)
* **Avatar alt:** {{testimonial_avatar_alt}} (optional — defaults to author name)
* **Photo:** {{testimonial_photo}} (optional — legacy alias for avatar)

---

# FAQ

Maps to `src/config/faq.ts`.

## {{question_1}}

{{answer_1}}

## {{question_2}}

{{answer_2}}

## {{question_3}}

{{answer_3}}

Add more as needed.

---

# Pages Required

Select pages to build. Check all that apply.

**Core:**

* [ ] Home
* [ ] About
* [ ] Services
* [ ] Contact
* [ ] Privacy Policy
* [ ] Terms of Service

**Optional:**

* [ ] Portfolio
* [ ] FAQ
* [ ] Pricing
* [ ] Blog
* [ ] Team
* [ ] Testimonials
* [ ] Case Studies

## Primary Pages for Initial Build

List the pages to generate first (e.g. Home, About, Portfolio, Contact):

1. {{primary_page_1}}
2. {{primary_page_2}}
3. {{primary_page_3}}
4. {{primary_page_4}}

---

# Page Content Specification

Define copy and section content per page. Section components and layout follow `AI_TEMPLATE_RULES.md` page archetypes.

Remove sections not needed for a given website. Add section notes where the default archetype should be customized.

---

## Home Page

### Purpose

{{home_page_purpose}}

Visual direction: {{home_visual_direction}} (e.g. "More visuals, less text, generous whitespace, strong CTAs")

### Sections

Enable and fill in each section used on the home page.

#### Hero

* **Layout:** two-column (headline left, media right)
* **Heading:** {{home_hero_heading}}
* **Heading highlight (optional):** {{home_hero_heading_highlight}} — second line with gold gradient; omit for single-line titles
* **Supporting headline:** {{home_hero_subheading}}
* **Paragraph:** {{home_hero_paragraph}}
* **Trust points (optional):** {{trust_point_1}}, {{trust_point_2}}, {{trust_point_3}}
* **Primary CTA label:** {{home_hero_cta_primary}}
* **Primary CTA link:** {{home_hero_cta_primary_href}}
* **Secondary CTA label:** {{home_hero_cta_secondary}}
* **Secondary CTA link:** {{home_hero_cta_secondary_href}}
* **Media type:** {{home_hero_media_type}} (video placeholder / image / none)
* **Media caption:** {{home_hero_media_caption}}
* **Media image path:** {{home_hero_media_image}}

#### Impact Strip

Use Outcome Cards section above, or define inline:

* {{impact_item_1}}
* {{impact_item_2}}
* {{impact_item_3}}
* {{impact_item_4}}

#### Services Preview

* **Heading:** {{services_preview_heading}}
* **Subheading:** {{services_preview_subheading}}
* **Services to show:** list service names or "top 4 from Services section"

#### Pricing Selector

* **Enabled:** {{pricing_selector_enabled}} (yes / no)
* **Heading:** {{pricing_selector_heading}}
* Use Tier Summaries from Packages section

#### Consultation CTA

* **Heading:** {{consultation_cta_heading}}
* **Paragraph:** {{consultation_cta_paragraph}}
* **Bullets:** {{consultation_bullet_1}}, {{consultation_bullet_2}}, {{consultation_bullet_3}}
* **Button label:** {{consultation_cta_button}}
* **Button link:** {{consultation_cta_link}}
* **Include booking mockup:** {{consultation_booking_mockup}} (yes / no)
* **Supporting image:** {{consultation_cta_image}}

#### Featured Work

* **Enabled:** {{featured_work_enabled}} (yes / no)
* Use Featured Work Preview section above

#### Testimonials

* **Enabled:** {{home_testimonials_enabled}} (yes / no)

---

## About Page

### Purpose

{{about_page_purpose}}

Visual direction: {{about_visual_direction}} (e.g. "More information, fewer visuals, clear hierarchy")

### Sections

#### About Hero

* **Heading:** {{about_hero_heading}}
* **Heading highlight (optional):** {{about_hero_heading_highlight}}
* **Subheading:** {{about_hero_subheading}}
* **Paragraph:** {{about_hero_paragraph}}
* **Image:** {{about_hero_image}}

#### What We Do / Intro

* **Heading:** {{about_intro_heading}}
* **Paragraph:** {{about_intro_paragraph}}

#### Capabilities Row

Use Capabilities Row section above.

#### Process Steps

Use Process Steps section above.

#### Why Choose Us

Use Why Choose Us section above.

#### Phased Implementation

* **Enabled:** {{phased_implementation_enabled}} (yes / no)
* Use Phased Implementation section above.

#### CTA

* **Heading:** {{about_cta_heading}}
* **Button label:** {{about_cta_button}}
* **Button link:** {{about_cta_link}}

---

## Portfolio Page

### Purpose

{{portfolio_page_purpose}}

### Sections

#### Portfolio Hero

* **Heading:** {{portfolio_hero_heading}}
* **Heading highlight (optional):** {{portfolio_hero_heading_highlight}}
* **Paragraph:** {{portfolio_hero_paragraph}}
* **Media type:** {{portfolio_hero_media_type}}
* **Media image:** {{portfolio_hero_media_image}}

#### Portfolio Grid

Use Portfolio section above. Cards link to `/portfolio/[slug]`.

#### Stats Strip

* **Enabled:** {{portfolio_stats_enabled}} (yes / no)
* Use Stats Strip section above.

#### CTA

* **Heading:** {{portfolio_cta_heading}}
* **Primary button:** {{portfolio_cta_primary}} → {{portfolio_cta_primary_href}}
* **Secondary button:** {{portfolio_cta_secondary}} → {{portfolio_cta_secondary_href}}

---

## Portfolio Detail Page

One page per portfolio item at `/portfolio/[slug]`. Content comes from the item's `detail` object in `portfolio.ts` — not a separate page spec section.

### Purpose

{{portfolio_detail_page_purpose}}

### Sections (platform defaults)

* **Back link** — returns to `/portfolio` (label uses `portfolioConfig.pageTitle`)
* **Hero** — category, title, summary, optional client/year/services meta, lead image
* **Videos** — when `detail.videos[]` is populated
* **Gallery** — when `detail.images[]` is populated
* **Client feedback** — when `detail.testimonial` is populated
* **CTA** — contact action + link back to portfolio listing

Per-item SEO uses the item title and summary/description.

---

## Contact Page

### Purpose

{{contact_page_purpose}}

### Sections

#### Contact Hero

* **Heading:** {{contact_hero_heading}}
* **Heading highlight (optional):** {{contact_hero_heading_highlight}}
* **Paragraph:** {{contact_hero_paragraph}}
* **Image:** {{contact_hero_image}}

#### Contact Form

Use Contact Form section below.

#### Booking Mockup

* **Enabled:** {{booking_mockup_enabled}} (yes / no)
* **Section title:** {{booking_section_title}}
* **Available times:** {{booking_time_1}}, {{booking_time_2}}, {{booking_time_3}}, {{booking_time_4}}, {{booking_time_5}}
* **Confirm button label:** {{booking_confirm_label}}

#### Contact Info Cards

Display from Contact Information section:

* Call: {{phone}}
* Email: {{email}}
* Messaging app: {{messaging_label}} → {{messaging_link}}
* Office hours: {{office_hours}}
* Location: {{address}}

#### FAQ

* **Enabled on contact page:** {{contact_faq_enabled}} (yes / no)
* Use FAQ section above (subset or full list)

#### CTA

* **Heading:** {{contact_cta_heading}}
* **Button label:** {{contact_cta_button}}

---

## Services Page

Optional. Omit if services are covered on Home and About only.

### Purpose

{{services_page_purpose}}

### Sections

#### Page Header

* **Title:** {{services_page_title}}
* **Title highlight (optional):** {{services_page_title_highlight}} — second line with gold gradient; omit for single-line titles
* **Intro:** {{services_page_intro}}

#### Service Grid

Use full Services section above.

#### Package Overview (tiered services)

* **Enabled:** {{services_pricing_enabled}} (yes / no)
* When enabled, tier cards render inline within the service grid (linked by `serviceId`)
* Use Packages and Pricing → Service Package Groups above

#### Bundle Packages

* **Enabled:** {{services_bundles_enabled}} (yes / no)
* Use Packages and Pricing → One-Off / Bundle Packages above
* **Heading:** {{services_bundles_heading}}
* **Subheading (optional):** {{services_bundles_subheading}}

#### À La Carte Pricing

* **Enabled:** {{services_alacarte_enabled}} (yes / no)
* Use Packages and Pricing → Individual / À La Carte Items above
* **Heading:** {{services_alacarte_heading}}
* **Subheading (optional):** {{services_alacarte_subheading}}

#### Terminology

* **Enabled:** {{services_terminology_enabled}} (yes / no)
* Use Packages and Pricing → Terminology Definitions above
* **Heading:** {{services_terminology_heading}}
* **Subheading (optional):** {{services_terminology_subheading}}

#### CTA

* **Heading:** {{services_cta_heading}}
* **Button label:** {{services_cta_button}}

---

# Contact Form

Maps to `src/config/form.ts`.

## Provider

Select one:

* FormSubmit (default)
* Formspree
* Web3Forms
* Custom Endpoint

**Selected:** {{contact_form_provider}}

## Endpoint Configuration

For **FormSubmit**, set the recipient email (usually the same as company email). Example: `hello@yourdomain.com`. Optional env override: `PUBLIC_FORMSUBMIT_EMAIL`.

For **Web3Forms**, set the access key. Optional env override: `PUBLIC_WEB3FORMS_KEY`.

For **Formspree**, set the form ID or full Formspree URL.

For **Custom Endpoint**, set the full POST URL.

{{contact_form_endpoint}}

## Subject Line

{{contact_form_subject}}

## Form Title

{{contact_form_title}} (e.g. "Send Us a Message")

## Fields

Define each field. Standard set shown; add or remove as needed.

| Field | Label | Type | Required | Notes |
| ----- | ----- | ---- | -------- | ----- |
| fullName | Full Name | text | yes | |
| businessName | Business Name | text | no | |
| email | Email Address | email | yes | |
| phone | Phone / Messaging | tel | no | |
| serviceNeeded | Service Needed | select | no | options from Services |
| packageInterest | Package Interest | select | no | options from tier names + bundles |
| alaCarteInterest | Individual Item Interest | select | no | options from `packages.ts` → `alaCarte` |
| consultationDate | Preferred Consultation Date | date | no | |
| message | Message | textarea | yes | |

### Service Needed Options

Populate from Services section, plus:

* {{service_option_extra_1}} (e.g. "Not Sure Yet")

### Package Interest Options

Populate from tier names and bundles, plus:

* Custom
* {{package_option_extra}} (e.g. "Not Sure Yet")

### Individual Item Interest Options

Populate from Packages and Pricing → Individual / À La Carte Items (`packages.ts` → `alaCarte`), label format `{item} — {price}`, plus:

* {{ala_carte_option_extra}} (e.g. "Not Sure Yet")

## Messages

* **Success:** {{form_success_message}}
* **Error:** {{form_error_message}}

---

# Images

Provide paths, filenames, or "placeholder" when assets are not yet available.

Paths may use either:

* **`src/assets/...`** — for Astro-optimized imports
* **`public/...`** — referenced in config as URL strings (e.g. `/images/hero.svg`, `/gallery/brand-films/brand-film.jpg`)

During initial build, SVG or JPG placeholders in `public/images/` and `public/gallery/` are acceptable even when the spec lists `src/assets/` paths. Update config paths when final assets are supplied.

## Brand Assets

| Asset | Path | Alt text |
| ----- | ---- | -------- |
| Logo (standard) | {{logo_path}} | {{logo_alt}} |
| Logo (inverse/light) | {{logo_white_path}} | {{logo_white_alt}} |
| Favicon | {{favicon_path}} | — |
| Default OG image | {{og_image_path}} | {{og_image_alt}} |

## Page and Section Images

| Purpose | Path | Alt text |
| ------- | ---- | -------- |
| Home hero | {{home_hero_image}} | {{home_hero_alt}} |
| About hero | {{about_hero_image}} | {{about_hero_alt}} |
| Portfolio hero | {{portfolio_hero_image}} | {{portfolio_hero_alt}} |
| Contact hero | {{contact_hero_image}} | {{contact_hero_alt}} |
| Consultation CTA | {{consultation_cta_image}} | {{consultation_cta_alt}} |
| Video placeholder | {{video_placeholder_image}} | {{video_placeholder_alt}} |

## Service Images

| Service | Path | Alt text |
| ------- | ---- | -------- |
| {{service_1}} | {{service_1_image}} | {{service_1_alt}} |
| {{service_2}} | {{service_2_image}} | {{service_2_alt}} |
| {{service_3}} | {{service_3_image}} | {{service_3_alt}} |

## Portfolio Images

Organize under `src/assets/gallery/` or `public/gallery/` by category when possible.

| Item | Path | Alt text |
| ---- | ---- | -------- |
| {{portfolio_item_1}} | {{portfolio_image_1}} | {{portfolio_alt_1}} |

## Team and Testimonial Photos

Optional.

| Person | Path | Alt text |
| ------ | ---- | -------- |
| {{team_member_1}} | {{team_photo_1}} | {{team_alt_1}} |

## Image Fallback Rule

If an image is not yet available, note `placeholder` and provide descriptive alt text so placeholders can be replaced without code changes. Placeholder files may live in `public/` during initial build; update config paths when moving to optimized assets in `src/assets/`.

---

# SEO

Maps to `src/config/seo.ts`.

## Primary Keywords

* {{primary_keyword_1}}
* {{primary_keyword_2}}
* {{primary_keyword_3}}

## Secondary Keywords

* {{secondary_keyword_1}}
* {{secondary_keyword_2}}
* {{secondary_keyword_3}}

## Geographic Focus

* Country: {{country}}
* Region: {{region}}
* City: {{city}}

## Per-Page Metadata

Fill in for each page built.

### Home

* **Title:** {{seo_home_title}}
* **Description:** {{seo_home_description}}

### About

* **Title:** {{seo_about_title}}
* **Description:** {{seo_about_description}}

### Portfolio

* **Title:** {{seo_portfolio_title}}
* **Description:** {{seo_portfolio_description}}

### Contact

* **Title:** {{seo_contact_title}}
* **Description:** {{seo_contact_description}}

### Services

* **Title:** {{seo_services_title}}
* **Description:** {{seo_services_description}}

### FAQ

* **Title:** {{seo_faq_title}}
* **Description:** {{seo_faq_description}}

---

# Copy Tone and Messaging

## Tone

Describe the voice for all website copy.

{{copy_tone}} (e.g. professional, confident, premium, approachable, strategic)

## Messaging Goals

What the website should make visitors feel or understand:

* {{messaging_goal_1}}
* {{messaging_goal_2}}
* {{messaging_goal_3}}

## Language Preferences

* Preferred phrases: {{preferred_phrase_1}}, {{preferred_phrase_2}}
* Avoid: {{avoid_phrase_1}}, {{avoid_phrase_2}}
* Do not overpromise guaranteed results: {{results_language_rule}}

---

# Config File Mapping

When building, populate these config files from the sections above:

| Config file | Source sections in this spec |
| ----------- | --------------------------- |
| `site.ts` | Website Information, Branding |
| `company.ts` | Website Information, Contact Information |
| `navigation.ts` | Navigation |
| `services.ts` | Services |
| `packages.ts` | Packages and Pricing |
| `portfolio.ts` | Portfolio, Featured Work Preview, portfolio detail pages |
| `form.ts` | Contact Form |
| `design.ts` | Extended Design Tokens, Branding — set `enabled: true` for dark/premium sites |
| `content.ts` | Page section copy, heroes, CTAs, shared blocks (outcomes, process, stats) |
| `faq.ts` | FAQ |
| `testimonials.ts` | Testimonials |
| `seo.ts` | SEO, Per-Page Metadata |
| `pages.ts` | Page Content Specification (section enable/disable and ordering) |

---

# Additional Requirements

Any client-specific notes not covered above.

{{additional_requirements}}

---

# Checklist Before Build

* [ ] All placeholders replaced or intentionally marked "TBD"
* [ ] Pages Required section completed
* [ ] Navigation and CTAs defined
* [ ] Services and optional packages filled in
* [ ] Page content sections enabled/disabled per page
* [ ] Form fields and dropdown options match services and tiers
* [ ] Images listed with paths or placeholder notes
* [ ] SEO metadata drafted for each page
* [ ] Copy tone and messaging goals defined
* [ ] Unused optional sections removed or marked N/A
