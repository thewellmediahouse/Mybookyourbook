# TheWellMediaHouseWebsiteInputSpec.md

## Purpose

This document is the **single source of truth for The Well Media House website content**.

Populate pages, copy, branding, navigation, services, pricing, portfolio, forms, images, CTAs, and SEO from this specification.

| Document | Role |
| -------- | ---- |
| `AI_TEMPLATE_RULES.md` | Platform architecture, components, and design system |
| `TheWellMediaHouseWebsiteInputSpec.md` | The Well Media House business content |

When building, follow `AI_TEMPLATE_RULES.md` for implementation. All business-specific values live in this file.

This site is implemented on the **`wellmedia` branch** of the template repository — the only client site co-located there. Other clients should use separate repositories cloned from `main`.

---

# Website Information

## Company Name

The Well Media House

## Website URL

https://thewellmediahouse.com

## Industry

Business growth agency, media production, content creation, website development, digital marketing, tourism marketing, accommodation marketing, event marketing, and business strategy consulting.

## Positioning Statement

Business Growth Partner — not only a social media marketing company.

## Tagline

We Create. You Grow.

## Supporting Taglines

* More Than Marketing. Real Business Growth.
* Create. Connect. Grow.
* Premium media, smart strategy, and business growth systems.
* We help businesses get seen, get booked, and grow sustainably.

## Short Description

The Well Media House is a premium media and business growth partner that helps businesses increase visibility, generate enquiries, improve bookings and sales, and build sustainable growth systems through strategy, media production, content management, websites, and consulting.

## Long Description

The Well Media House is not positioned as a standard social media marketing agency. We are a Business Growth Partner that helps businesses establish systems, develop revenue streams, create brand awareness, increase bookings and sales, and grow with clarity and structure.

We combine strategy, business development, premium media production, website development, content creation, content management, tourism marketing, accommodation marketing, event planning support, and growth consulting into one integrated partnership.

Our goal is to help clients move from scattered marketing efforts to a clear, measurable, and scalable growth system. We create the content, websites, strategy, offers, campaigns, and implementation structure needed to help businesses attract the right audience and convert attention into enquiries, bookings, sales, and long-term growth.

Projects do not have to launch all at once. The website must communicate that The Well Media House can phase work in strategic stages so clients can start with the highest-impact priorities and build momentum over time.

## Language and Locale

* Language: `en`
* Locale: `en-ZA`

---

# Branding

## Primary Color

Dark navy / midnight blue — `#061426`

## Secondary Color

Near black / deep charcoal — `#020814`

## Accent Color

Luxury gold — `#D9A441`

## Additional Accent Color

Electric blue for subtle glow and media-tech highlights — `#1EA7FF`

Gold light (gradient partner): `#F2C766`

Cyan (optional highlight): `#16D6D9`

## Neutral Colors

* Text primary: `#FFFFFF` — headings (`text-fg`)
* Text soft (body): `#E2E8F0` — paragraphs, list items (`text-fg-soft`)
* Text muted: `#B8C5D6` — labels, secondary info (`text-fg-muted`)
* Text subtle: `#94A3B8` — captions, fine print only (`text-fg-subtle`)
* Background: `#061426`
* Background deep: `#050A18`
* Border: `rgba(217, 164, 65, 0.22)` — gold-tinted card borders

## Preferred Style

Luxury, modern, cinematic, premium, strategic, clean, business-focused, and trustworthy.

The design should feel like a high-end media and growth consultancy, not a generic marketing agency. Use dark navy gradients, gold buttons, cinematic imagery, rounded cards, generous spacing, soft shadows, subtle glow effects, and strong typography.

## Theme Mode

Dark — `site.ts` → `branding.themeMode: 'dark'`; `design.ts` → `enabled: true`

## Design Rules

* Keep the design modern but simple.
* Use generous padding between sections; avoid overcrowding pages.
* Use fewer visual blocks on the About page.
* Use real-looking visuals of cinema cameras, business growth, client meetings, product photography, and tourism/accommodation.
* Use subtle gradients, not overly busy backgrounds.
* Use rounded corners on cards, media blocks, buttons, forms, and image containers.
* Use clear headings and concise copy.
* Use plan names **Silver**, **Gold**, and **Platinum** only.
* Do not use **Essential**, **Basic**, or **Advance** anywhere on the website.
* Home page: simple, spacious, premium, emotionally persuasive.
* About page: informative, direct, less visually crowded.

## Extended Design Tokens

Maps to `src/config/design.ts` with `enabled: true`. Gradients are exported as CSS variables and applied via `global.css` — see `AI_TEMPLATE_RULES.md`.

### Gradients

* Hero: `linear-gradient(135deg, #020814 0%, #061426 100%)`
* Page (body backdrop): radial spotlight + deep navy
* Gold: `linear-gradient(135deg, #D9A441 0%, #F2C766 100%)`
* Accent (CTA buttons): metallic horizontal gold gradient
* Blue: `linear-gradient(135deg, #1EA7FF 0%, #061426 100%)`
* Cyan: `linear-gradient(135deg, #16D6D9 0%, #061426 100%)`
* Card surface: subtle white overlay gradient on dark base
* Divider / edge: horizontal gold fade between sections

### Typography

* Display / heading font: elegant serif or strong display font (system fonts first if external fonts not configured)
* Body font: clean sans-serif

### Spacing and Layout

* Section padding (desktop / tablet / mobile): `py-24` / `py-20` / `py-14`
* Container max width: `max-w-7xl`
* Card border radius: `rounded-2xl` (small cards), `rounded-3xl` (large media blocks)
* Button border radius: `rounded-full` or `rounded-xl`

---

# Contact Information

## Email

thewellmediahouse@gmail.com

## Phone

082 554 8983

## Messaging App

* Provider: WhatsApp
* Link: `https://wa.me/27825548983`
* Display label: Chat on WhatsApp
* Accessible button label: Chat with The Well Media House on WhatsApp

## Address

South Africa

## Office Hours

Monday – Friday, 9:00 AM – 5:00 PM

## Footer Brand Statement

We create content and growth systems that help businesses be seen, get booked, and grow sustainably.

---

# Social Links

* LinkedIn: To be added
* Facebook: To be added
* Instagram: To be added
* X: Not required unless supplied later
* YouTube: To be added
* TikTok: Not required
* Other: —

---

# Navigation

## Header Navigation

* Home
* About
* Portfolio
* Services
* Contact

## Header CTA

* Label: Book Consultation
* Link: `/contact`

## Footer Navigation

* Home
* About
* Portfolio
* Services
* Contact
* Privacy Policy
* Terms of Service

## Footer Service Links

* Content Creation → `/services#content-creation`
* Content Management → `/services#content-management`
* Business Growth → `/services#business-growth`
* Starter / Launch Pack → `/services#starter-launch-pack`
* Website Development → `/services#website-development`
* Product Photography → `/services#content-creation`
* Event Marketing → `/services#event-marketing`
* Tourism & Accommodation Marketing → `/services#tourism-accommodation-marketing`

---

# Global Website Content

## Header

* Sticky: yes
* Logo variant: white (on dark background)
* Header CTA enabled: yes
* Notes: Logo on the left; navigation center or right; gold "Book Consultation" button on the right; dark navy / black glass-style background; subtle gold active navigation indicator

## Floating Messaging Bubble

* Enabled: yes
* Position: bottom-right
* Visible on all pages: yes
* Must not block important form buttons on mobile

## Footer

Must include:

* Logo
* Footer brand statement (see Contact Information)
* Footer navigation links
* Footer service links
* Contact details (email, phone, WhatsApp)
* Social media icon placeholders
* WhatsApp CTA
* Copyright: © 2026 The Well Media House. All rights reserved.

---

# Services

## Service 1 — Content Creation

* **Name:** Content Creation
* **Slug:** `content-creation`
* **Short description:** High-impact videos, photos, reels, product content, and brand visuals.
* **Full description:** High-impact video, photo, reel, product, and brand content created to capture attention, build trust, and tell the story of the business in a premium way.
* **Image:** `src/assets/images/product-photo.jpg` (placeholder)

**Benefits:**

* Professional videos and visuals that elevate the brand.
* Content that captures attention and improves credibility.
* Product photography that helps sell products more effectively.
* Reels, brand films, and promotional videos that support marketing campaigns.
* Cinema-quality media that can be used across websites, social media, ads, and proposals.

---

## Service 2 — Content Management

* **Name:** Content Management
* **Slug:** `content-management`
* **Short description:** Consistent posting, copywriting, page management, and campaign support.
* **Full description:** Consistent social media and digital content management designed to keep the brand visible, structured, and active with the right message and strategy.
* **Image:** `src/assets/images/facebook-page.jpg` (placeholder)

**Benefits:**

* Consistent posting and copywriting.
* Improved social media presence.
* Campaign support and ad management.
* Website content adjustments where included.
* Helps turn content into an organised system instead of random posts.

---

## Service 3 — Business Growth

* **Name:** Business Growth
* **Slug:** `business-growth`
* **Short description:** Strategy, systems, revenue streams, events, and growth consulting.
* **Full description:** Growth strategy, business development, revenue stream planning, marketing structure, event support, and concept development focused on helping the business scale sustainably.
* **Image:** `src/assets/images/business-growth.jpg` (placeholder)

**Benefits:**

* Clear growth strategy and direction.
* New product and revenue stream development.
* Marketing avenue planning.
* Event concepts, ticketing support, and growth campaigns.
* Better systems for bookings, sales, visibility, and long-term business growth.

---

## Service 4 — Starter / Launch Pack

* **Name:** Starter / Launch Pack
* **Slug:** `starter-launch-pack`
* **Short description:** A powerful starting point for businesses that need brand, website, store, and media assets.
* **Full description:** A high-value launch package for businesses that need the core assets to start growing quickly, including brand assets, website, online store, promotional media, and professional photos.
* **Image:** placeholder

**Benefits:**

* Saves money compared with individual services.
* Gives the client a strong foundation quickly.
* Includes brand, website, shop, video, and photo assets.
* Ideal for businesses that want to launch or relaunch professionally.

---

## Service 5 — Website Development & Digital Systems

* **Name:** Website Development & Digital Systems
* **Slug:** `website-development`
* **Short description:** Modern websites, online stores, and digital systems that convert visitors into enquiries and sales.
* **Full description:** Modern websites, online stores, booking systems, digital structures, and online visibility tools designed to help businesses convert visitors into enquiries, bookings, and sales.
* **Image:** placeholder

**Benefits:**

* Professional online presence.
* Better customer experience.
* Online store and e-commerce setup.
* Booking and enquiry structure.
* Website systems that support business growth.

---

## Service 6 — Tourism & Accommodation Marketing

* **Name:** Tourism & Accommodation Marketing
* **Slug:** `tourism-accommodation-marketing`
* **Short description:** Marketing and media for tourism businesses, lodges, resorts, and destination experiences.
* **Full description:** Marketing, media, and digital strategy for tourism businesses, lodges, resorts, guest houses, accommodation brands, and destination experiences.
* **Image:** `src/assets/images/tourism.jpg` (placeholder)

**Benefits:**

* Stronger visual storytelling.
* Better guest experience presentation.
* More enquiries and bookings.
* Destination-focused campaigns.
* Improved trust and perceived value.

---

## Service 7 — Event Planning Support & Event Marketing

* **Name:** Event Planning Support & Event Marketing
* **Slug:** `event-marketing`
* **Short description:** Event concepts, ticketing, media coverage, and promotional campaigns.
* **Full description:** Support for event concepts, ticketing, media coverage, promotional campaigns, event visibility, and post-event content.
* **Image:** `src/assets/images/event.jpg` (placeholder)

**Benefits:**

* Better event structure and promotion.
* Ticketing and campaign support.
* Premium event media.
* Clearer audience communication.
* Stronger post-event content and brand impact.

---

# Packages and Pricing

## Tier Naming Convention

Use consistently across the entire website — selectors, forms, and pricing tables.

* Tier 1: Silver
* Tier 2: Gold
* Tier 3: Platinum

**Never use:** Essential, Basic, or Advance.

## Tier Summaries

Short labels for home page pricing selector:

| Tier | Label | Tagline |
| ---- | ----- | ------- |
| Silver | Solid Foundation | For businesses that need essential structure, content, and visibility. |
| Gold | Stronger Growth | For businesses ready to build momentum and increase bookings. |
| Platinum | Maximum Impact | For businesses that want a full growth partner across media, management, and strategy. |

Pricing selector note:

Not sure what you need? Book a consultation and we'll guide you.

---

## Service Package Groups

Recommended tier and accent per group (maps to `packages.ts`):

| Service | Service ID | Recommended tier | Accent |
| ------- | ---------- | ---------------- | ------ |
| Content Creation | `content-creation` | `content-gold` | `highlight` (blue) |
| Content Management | `content-management` | `management-gold` | `cyan` |
| Business Growth | `business-growth` | `growth-gold` | `accent` (gold) |

Tier icons: Silver ◆, Gold ★, Platinum ♛ (via `designConfig.packages.tierIcons`).

### Package Group: Content Creation

#### Silver — R5 000 pm

* 5 x Entry videos per month OR
* 2 x One Set videos
* 10 x product shoot and edit
* 4 x posters or advert deals
* PS: videos are no longer than 2 minutes

#### Gold — R10 000 pm

* 8 x Entry videos per month OR
* 4 x One Set videos
* 1 x cinema Expert Video / promo video
* 15 x product shoot and edit
* 10 x posters or advert deals
* PS: videos are no longer than 2 minutes

#### Platinum — R15 000 pm

* 12 x Entry videos per month OR
* 8 x One Set videos
* 2 x cinema Expert Video / promo video
* 30 x product shoot and edit
* 15 x posters or advert deals
* PS: videos are no longer than 2 minutes

---

### Package Group: Content Management

#### Silver — R2 500 pm

* 2 x social media platforms
* 4 x posts per month with copywriting, excluding media
* 1 x consultation for social media growth
* 1 x ad management up to R2 000

#### Gold — R4 000 pm

* 3 x social media platforms
* 8 x posts per month with copywriting, excluding media
* 2 x consultations for social media growth
* 1 x ad management up to R3 000
* 2 x website management adjustments per month

#### Platinum — R5 000 pm

* 4 x social media platforms
* 16 x posts per month with copywriting, excluding media
* 2 x consultations for social media growth
* 1 x ad management up to R3 000
* 4 x website management adjustments per month
* 1 x full online shop management, including special deals, courier coordination, and shop updates

---

### Package Group: Business Growth

#### Silver — R3 000 pm

* 1 x product development
* 2 x monthly growth strategy sessions
* 1 x marketing avenue strategy session
* 1 x event management support, excluding paid marketing, including ticketing support where required
* 1 x concept development
* Marketing structures drafting

#### Gold — R5 000 pm

* 2 x product development
* 3 x monthly growth strategy sessions
* 2 x marketing avenue strategy sessions
* 2 x event management support, excluding paid marketing, including ticketing support where required
* 2 x concept development
* 1 x marketing structures drafting

#### Platinum — R7 000 pm

* 4 x product development
* 4 x monthly growth strategy sessions
* 3 x marketing avenue strategy sessions
* 3 x event management support, excluding paid marketing, including ticketing support where required
* 3 x concept development
* 2 x marketing structures drafting

---

## One-Off / Bundle Packages

### Launch Pack — R25 000

* Savings message: Save R15 000 compared with selected individual services.
* Logo design and email signature
* Website
* Online store
* Product promo video
* Cinema video of company
* 10 product photos
* 5 business portfolio photos

---

## Individual / À La Carte Items

| Item | Price |
| ---- | ----- |
| Website development alone, 4 page website | R7 000 |
| Online shop with 20 product shoot | R10 000 |
| Both website and online shop | R15 000 |
| Logo design | R1 000 |
| Email signature | R500 |
| Email domain setup | R500 |
| Product promotional video | R5 000 |
| Product photography | R300 per image |
| Professional business portraits | R300 per photo |
| Cinematic theme or company long promo | R10 000 |

---

## Terminology Definitions

### Entry Video

Stock footage-based video. High-quality stock footage edited into engaging and affordable short-form video content.

### One Set Video

Podcast-type, talking-head, or one-scene reel filmed in a single setup with clean audio, lighting, and professional editing.

### Expert Video

Multi-location cinema video with multiple angles, premium footage, drone footage where applicable, and a more cinematic production approach.

---

# Outcome Cards

Used for home page impact strip.

| Title | Description |
| ----- | ----------- |
| More Visibility | Be seen by the right audience. |
| More Bookings | Turn attention into enquiries. |
| More Revenue | Create systems that support sales. |
| Systems for Growth | Build momentum that lasts. |

---

# Process Steps

Used for About page.

| Step | Title | Description |
| ---- | ----- | ----------- |
| 1 | Build the Foundation | We clarify your goals, audience, offer, positioning, and systems. |
| 2 | Create Demand | We create media, campaigns, and content that increase visibility and trust. |
| 3 | Increase Bookings & Sales | We connect marketing to enquiries, bookings, sales, and customer journeys. |
| 4 | Scale for Growth | We refine, optimise, and scale the systems that are working. |

---

# Phased Implementation

Intro paragraph:

We understand that every business is different. That is why we can phase the project in stages. You do not need to launch everything at once. We can start with the highest-impact priorities and build from there.

| Phase | Title | Description |
| ----- | ----- | ----------- |
| 1 | Foundation | Establish core brand, systems, and initial content. |
| 2 | Momentum | Build visibility, campaigns, and consistent growth activity. |
| 3 | Scale | Refine and expand what is working for long-term revenue growth. |

---

# Why Choose Us

* **Heading:** One Partner. Endless Possibilities.
* **Paragraph:** Instead of managing multiple providers for content, websites, strategy, and campaigns, clients work with one team that understands the bigger picture.

**Bullets:**

* One partner for strategy, systems, content, and growth.
* Premium media quality that elevates the brand.
* Measurable outcomes focused on bookings, sales, and visibility.
* Systems that help the business grow sustainably.
* Phased implementation so everything does not need to launch at once.
* A growth mindset focused on long-term momentum.

---

# Capabilities Row

Compact list for About page icon/text row:

* Growth Strategy & Business Development
* Premium Media Production
* Website Development & Digital Systems
* Tourism & Destination Marketing
* Accommodation Marketing
* Event Planning Support
* Growth Consulting & Scaling Systems

---

# Portfolio

## Portfolio Page Title

Our Work

## Categories

* Videos
* Facebook Pages Managed
* Product Photography
* Client Meetings
* Tourism & Accommodation
* Events
* Business Growth

("All" is the default filter — include in implementation.)

---

## Portfolio Items

Each item has a listing card on `/portfolio` and a detail page at `/portfolio/[slug]`. Card fields and detail content are defined in `src/config/portfolio.ts`.

### Item 1 — Brand Film

* **Slug:** `brand-film`
* **Title:** Brand Film
* **Category:** Videos
* **Description:** Cinematic storytelling that builds brand identity.
* **Image:** `src/assets/gallery/brand-films/brand-film.jpg` (placeholder)
* **Is video:** yes

### Item 2 — Product Shoot

* **Slug:** `product-shoot`
* **Title:** Product Shoot
* **Category:** Product Photography
* **Description:** High-end product photography that highlights every detail.
* **Image:** `src/assets/gallery/product-photography/product-shoot.jpg` (placeholder)
* **Is video:** no

### Item 3 — Client Meeting

* **Slug:** `client-meeting`
* **Title:** Client Meeting
* **Category:** Client Meetings
* **Description:** Strategy-led meetings that turn ideas into action.
* **Image:** `src/assets/gallery/client-meetings/client-meeting.jpg` (placeholder)
* **Is video:** no

### Item 4 — Facebook Page Managed

* **Slug:** `facebook-page`
* **Title:** Facebook Page Managed
* **Category:** Facebook Pages Managed
* **Description:** End-to-end page management that drives engagement.
* **Image:** `src/assets/images/facebook-page.jpg` (placeholder)
* **Is video:** no

### Item 5 — Tourism Campaign

* **Slug:** `tourism-campaign`
* **Title:** Tourism Campaign
* **Category:** Tourism & Accommodation
* **Description:** Compelling visuals that inspire travel and bookings.
* **Image:** `src/assets/gallery/tourism-accommodation/tourism-campaign.jpg` (placeholder)
* **Is video:** yes

### Item 6 — Resort Photography

* **Slug:** `resort-photography`
* **Title:** Resort Photography
* **Category:** Tourism & Accommodation
* **Description:** Premium imagery that showcases luxury and experience.
* **Image:** `src/assets/images/tourism.jpg` (placeholder)
* **Is video:** no

### Item 7 — Event Coverage

* **Slug:** `event-coverage`
* **Title:** Event Coverage
* **Category:** Events
* **Description:** Capturing moments that make events unforgettable.
* **Image:** `src/assets/gallery/events/event-coverage.jpg` (placeholder)
* **Is video:** yes

### Item 8 — Business Growth Campaign

* **Slug:** `business-growth-campaign`
* **Title:** Business Growth Campaign
* **Category:** Business Growth
* **Description:** Data-driven strategies that support real business results.
* **Image:** `src/assets/images/business-growth.jpg` (placeholder)
* **Is video:** no

### Detail pages

Each item above includes a `detail` object in `portfolio.ts` with summary, optional client/year/services meta, videos, images, and/or a testimonial. Detail pages are live at `/portfolio/[slug]` (e.g. `/portfolio/brand-film`).

---

# Featured Work Preview

Home page subset (5 cards). Each card links to its portfolio detail page via `slug`:

* Brand Films — Videos → `/portfolio/brand-film`
* Product Photography — Product Photography → `/portfolio/product-shoot`
* Client Success Stories — Client Meetings → `/portfolio/client-meeting`
* Tourism & Hospitality — Tourism & Accommodation → `/portfolio/tourism-campaign`
* Events & Experiences — Events → `/portfolio/event-coverage`

---

# Stats Strip

Placeholder metrics only — replace with verified data when available.

| Label | Value | Notes |
| ----- | ----- | ----- |
| More Reach | 10M+ | Placeholder — replace with verified data |
| More Engagement | 3.5M+ | Placeholder — replace with verified data |
| More Bookings | 250K+ | Placeholder — replace with verified data |
| Better Revenue Growth | 2.8X | Placeholder — replace with verified data |

Do not present placeholders as guaranteed results.

---

# Target Audience

The ideal clients are South African small businesses, growing brands, tourism businesses, accommodation providers, lodges, resorts, guest houses, local service providers, product-based businesses, event organisers, restaurants, hospitality businesses, ministries, and entrepreneurs who need more than basic marketing.

They need a partner who can help with strategy, content, systems, websites, visibility, bookings, sales, events, and long-term business growth.

The website should appeal to business owners who feel overwhelmed by marketing, struggle to post consistently, have weak websites, need better media, want to attract more customers, want more bookings, or need a full growth partner who can guide them step by step.

---

# Key Differentiators

* The Well Media House is a Business Growth Partner, not just a social media marketer.
* We combine strategy, media, websites, content, and business development under one partnership.
* We focus on visibility, bookings, sales, systems, and long-term revenue growth.
* We provide premium cinema-quality media production.
* We can help tourism, accommodation, events, hospitality, service, and product businesses.
* We offer phased implementation so the client does not need to launch everything at once.
* We help create revenue streams, offers, campaigns, and growth structures.
* We build content and systems that support measurable growth.
* We are invested in the client's long-term success.
* We create the foundation, then build momentum, then scale what works.

---

# Testimonials

No verified testimonials supplied yet. Use placeholders only if needed during initial build.

## Testimonial Placeholder 1

* **Quote:** "The Well Media House helped us clarify our message, improve our content, and build a stronger online presence."
* **Author:** Client Name
* **Role / Company:** Placeholder
* **Photo:** —

## Testimonial Placeholder 2

* **Quote:** "They became more than a media team — they helped us think strategically about growth, bookings, and long-term systems."
* **Author:** Client Name
* **Role / Company:** Placeholder
* **Photo:** —

## Testimonial Placeholder 3

* **Quote:** "The quality of the media and the strategy behind it helped our brand feel more professional and trustworthy."
* **Author:** Client Name
* **Role / Company:** Placeholder
* **Photo:** —

---

# FAQ

## How quickly do you respond?

We typically respond within 24 hours during business days.

## Are consultations free?

Yes. The initial consultation is free and obligation-free.

## Can you help small businesses?

Yes. We work with startups, growing brands, and established businesses.

## Do we need to launch everything at once?

No. We can phase the project in stages and start with the highest-impact priorities first.

## Are you only a social media company?

No. The Well Media House is a Business Growth Partner. We help with strategy, systems, content, websites, media production, events, and growth consulting.

## Can clients choose what they need?

Yes. Clients can explore Content Creation, Content Management, Business Growth, and Starter / Launch Pack options, then book a consultation for guidance.

## What is the best first step?

The best first step is to book a consultation so we can understand the business, goals, budget, and growth priorities.

---

# Pages Required

**Core:**

* [x] Home
* [x] About
* [x] Services
* [x] Contact
* [x] Privacy Policy
* [x] Terms of Service

**Optional (future):**

* [x] Portfolio
* [ ] FAQ (standalone page — FAQ also on Contact page)
* [ ] Pricing
* [ ] Blog
* [ ] Team
* [ ] Testimonials
* [ ] Case Studies

## Primary Pages for Initial Build

1. Home / Landing Page
2. About Page
3. Portfolio Page
4. Services Page
5. Contact / Book Consultation Page

---

# Page Content Specification

> **Image paths in section copy below** reference target asset locations (`src/assets/images/*.jpg`). The initial build uses equivalent SVG placeholders in `public/images/` — see the Images section for current paths.

---

## Home Page

### Purpose

The Home page must feel exciting, premium, and simple. It must make the visitor feel that The Well Media House can help transform their business, increase bookings, create better visibility, and build long-term growth.

Visual direction: More visuals, less text, generous whitespace, strong CTAs. Use fewer sections, more padding, and strong cinema camera and business success graphics.

### Sections

#### Hero

* **Layout:** two-column (headline left, media right)
* **Heading:** We Create.
* **Heading highlight:** You Grow.
* **Supporting headline:** We help businesses win bigger.
* **Paragraph:** Premium media, smart strategy, and business growth systems built to help your brand get seen, booked, and trusted.
* **Extended paragraph:** The Well Media House is more than a marketing company. We combine content creation, website development, media production, brand strategy, and growth consulting into one partnership designed to move your business forward.
* **Trust points:** More Visibility, More Bookings, More Revenue
* **Primary CTA label:** Book a Consultation
* **Primary CTA link:** `/contact`
* **Secondary CTA label:** View Our Services
* **Secondary CTA link:** `/services`
* **Media type:** video placeholder
* **Media caption:** Watch how we help businesses grow.
* **Media image path:** `src/assets/images/video-placeholder.jpg` (placeholder — cinema camera and business growth background)

#### Impact Strip

Use Outcome Cards section above.

#### Services Preview

* **Heading:** Flexible Solutions. Real Results.
* **Subheading:** Flexible solutions that can start small and scale as your business grows.
* **Services to show:** Content Creation, Content Management, Business Growth, Starter / Launch Pack

#### Pricing Selector

* **Enabled:** yes
* **Heading:** Choose Your Growth Level
* Use Tier Summaries from Packages section

#### Consultation CTA

* **Heading:** Let's Plan Your Next Breakthrough.
* **Paragraph:** Book a free consultation and let's map out how we can help your business attract more attention, increase enquiries, and grow with confidence.
* **Bullets:** Personalised Strategy, Growth-Focused Approach, Actionable Roadmap
* **Button label:** Book Now
* **Button link:** `/contact`
* **Include booking mockup:** yes
* **Supporting image:** cinema camera or director chair image (placeholder)

#### Featured Work

* **Enabled:** yes
* Use Featured Work Preview section above

#### Testimonials

* **Enabled:** no (no verified testimonials yet)

---

## About Page

### Purpose

The About page must be more informative and straightforward, with fewer blocks and fewer visuals. It must not overwhelm the visitor. Use one or two strong visuals only.

Visual direction: More information, fewer visuals, clear hierarchy.

### Sections

#### About Hero

* **Heading:** Your Business Growth
* **Heading highlight:** Partner.
* **Subheading:** Not just a social media marketing agency.
* **Paragraph:** At The Well Media House, we help businesses build the foundation, systems, content, and strategy needed to grow. We do not only create posts. We help businesses create demand, increase bookings and sales, improve brand awareness, and build long-term revenue streams.
* **Image:** `src/assets/images/cinema-camera.jpg` — cinema camera with business growth chart overlay (placeholder)

#### What We Do / Intro

* **Heading:** Strategy. Systems. Storytelling. Growth.
* **Paragraph:** We combine business strategy, premium media production, website development, content systems, tourism marketing, accommodation marketing, event planning support, and growth consulting into one integrated partnership.

#### Capabilities Row

Use Capabilities Row section above.

#### Process Steps

Use Process Steps section above.

#### Why Choose Us

Use Why Choose Us section above.

#### Phased Implementation

* **Enabled:** yes
* Use Phased Implementation section above.

#### CTA

* **Heading:** Ready to Grow Your Business?
* **Button label:** Book a Consultation
* **Button link:** `/contact`

---

## Portfolio Page

### Purpose

Showcase previous work categories in a premium, organised way.

### Sections

#### Portfolio Hero

* **Heading:** Our Work
* **Heading highlight:** Real Results.
* **Paragraph:** Explore a curated collection of work across brand videos, social media management, product photography, client meetings, tourism campaigns, accommodation marketing, events, and growth campaigns.
* **Media type:** video placeholder
* **Media image:** `src/assets/images/video-placeholder.jpg` (placeholder — cinema camera image and play button)

#### Portfolio Grid

Cards link to `/portfolio/[slug]`. Use Portfolio section above.

#### Stats Strip

* **Enabled:** yes
* Use Stats Strip section above (placeholders only).

#### CTA

* **Heading:** Ready to Become Our Next Success Story?
* **Primary button:** Book a Consultation → `/contact`
* **Secondary button:** View Services → `/services`

---

## Portfolio Detail Page

Route: `/portfolio/[slug]` — one static page per portfolio item.

### Purpose

Showcase a single project with structured media, context, and optional client feedback.

### Sections (platform defaults)

* **Back link** — "Back to Our Work" → `/portfolio`
* **Hero** — category, title, summary, client/year/services meta, lead image
* **Videos** — when the item has `detail.videos[]`
* **Gallery** — when the item has `detail.images[]`
* **Client feedback** — when the item has `detail.testimonial`
* **CTA** — Book a Consultation + View all work → `/portfolio`

All eight portfolio items currently have detail content in `portfolio.ts`.

---

## Contact Page

### Purpose

Make it easy for clients to contact, enquire, or book a consultation.

### Sections

#### Contact Hero

* **Heading:** Let's Talk About
* **Heading highlight:** Your Growth.
* **Paragraph:** Tell us about your business, your goals, and where you want to grow. We'll help you identify the best next step and create a plan that fits your needs.
* **Image:** `src/assets/images/client-meeting.jpg` (placeholder — handshake, business growth chart, or cinema camera with professional meeting feel)

#### Contact Form

Use Contact Form section below.

#### Booking Mockup

* **Enabled:** yes
* **Section title:** Book a Consultation
* **Available times:** 09:00 AM, 11:00 AM, 01:00 PM, 03:00 PM, 05:00 PM
* **Confirm button label:** Confirm Booking

#### Contact Info Cards

* Call Us: 082 554 8983
* Email Us: thewellmediahouse@gmail.com
* WhatsApp: Chat with us on WhatsApp → `https://wa.me/27825548983`
* Office Hours: Monday – Friday, 9:00 AM – 5:00 PM
* Location: South Africa

#### FAQ

* **Enabled on contact page:** yes (subset — first 3 questions)
* Questions: How quickly do you respond? / Are consultations free? / Can you help small businesses?

#### CTA

* **Heading:** Ready to Grow Your Business?
* **Button label:** Book Your Consultation Now

---

## Services Page

### Purpose

Full overview of all service offerings with detailed descriptions and benefits. Complements the home page services preview with the complete service list.

### Sections

#### Page Header

* **Enabled:** yes
* **Title:** Our Services.
* **Title highlight:** Built for Growth.
* **Intro:** End-to-end support tailored to your stage of growth.

#### Service Grid

* **Enabled:** yes
* **Heading:** What we offer
* Use full Services section above.
* Tier cards for Content Creation, Content Management, and Business Growth render inline when Package Overview is enabled.

#### Package Overview

* **Enabled:** yes
* Inline tier cards per service group (linked via `serviceId` in `packages.ts`)

#### Bundle Packages

* **Enabled:** yes
* **Heading:** One-Off / Bundle Packages
* **Subheading:** Fixed-price packages for launches and bundled deliverables.

#### À La Carte Pricing

* **Enabled:** yes
* **Heading:** Individual / À La Carte Items
* **Subheading:** Standalone pricing for individual deliverables.

#### Terminology

* **Enabled:** yes
* **Heading:** Terminology Definitions
* **Subheading:** Key terms used in our video and content packages.

#### CTA

* **Heading:** Not sure where to start?
* **Button label:** Book a consultation
* **Button link:** `/contact`

---

# Contact Form

## Provider

FormSubmit (default), Web3Forms, or Custom Endpoint.

**Selected:** FormSubmit

## Endpoint Configuration

Use company email: `hello@thewellmediahouse.com` (or `PUBLIC_FORMSUBMIT_EMAIL` at deploy time). Confirm the address via FormSubmit's one-time activation email after the first live submission.

## Subject Line

New enquiry from The Well Media House website

## Form Title

Send Us a Message

## Fields

| Field | Label | Type | Required | Notes |
| ----- | ----- | ---- | -------- | ----- |
| fullName | Full Name | text | yes | |
| businessName | Business Name | text | no | |
| email | Email Address | email | yes | |
| phone | Phone / WhatsApp | tel | no | |
| serviceNeeded | Service Needed | select | no | see options below |
| packageInterest | Package Interest | select | no | see options below |
| alaCarteInterest | Individual Item Interest | select | no | see options below |
| consultationDate | Preferred Consultation Date | date | no | |
| message | Message | textarea | yes | |

### Service Needed Options

* Content Creation
* Content Management
* Business Growth
* Starter / Launch Pack
* Website Development
* Product Photography
* Event Marketing
* Not Sure Yet

### Package Interest Options

Populated from tier names and bundle names in `packages.ts`, plus:

* Silver
* Gold
* Platinum
* Launch Pack (from `bundles[]`)
* Custom
* Not Sure Yet

### Individual Item Interest Options

Populated from `packages.ts` → `alaCarte` (label includes price), plus:

* Website development alone, 4 page website — R7 000
* Online shop with 20 product shoot — R10 000
* Both website and online shop — R15 000
* Logo design — R1 000
* Email signature — R500
* Email domain setup — R500
* Product promotional video — R5 000
* Product photography — R300 per image
* Professional business portraits — R300 per photo
* Cinematic theme or company long promo — R10 000
* Not Sure Yet

## Messages

* **Success:** Thank you. We have received your message and will contact you shortly.
* **Error:** Something went wrong. Please try again or contact us directly on WhatsApp.

---

# Images

Paths below are the target locations for final assets. The initial build uses branded SVG placeholders in `public/images/` and `public/gallery/` (referenced in config as `/images/...` and `/gallery/...`). Replace placeholders with final JPG/PNG and update config paths if filenames or locations change.

## Brand Assets

| Asset | Path | Alt text |
| ----- | ---- | -------- |
| Logo (standard) | `public/logo.svg` (initial) / `src/assets/brand/logo.png` (final) | The Well Media House logo |
| Logo (inverse/light) | `public/logo-white.svg` (initial) / `src/assets/brand/logo-white.png` (final) | The Well Media House logo |
| Favicon | `public/favicon.svg` | — |
| Default OG image | `public/og-default.svg` | The Well Media House — Business Growth Partner |

## Page and Section Images

| Purpose | Path (initial build) | Alt text |
| ------- | -------------------- | -------- |
| Home hero / video placeholder | `public/images/video-placeholder.svg` | Cinematic camera and business growth visual |
| About hero | `public/images/cinema-camera.svg` | Cinema camera with business growth chart |
| Portfolio hero | `public/images/video-placeholder.svg` | Brand film and cinema production visual |
| Contact hero | `public/images/client-meeting.svg` | Professional client meeting and business growth |
| Consultation CTA | `public/images/cinema-camera.svg` | Cinema camera on set |
| Business growth | `public/images/business-growth.svg` | Business growth chart and strategy visual |
| Product photography | `public/images/product-photo.svg` | Professional product photography setup |
| Tourism | `public/images/tourism.svg` | Tourism and accommodation marketing visual |
| Accommodation | `public/images/accommodation.svg` | Accommodation and hospitality visual |
| Event | `public/images/event.svg` | Event coverage and marketing visual |
| Facebook page managed | `public/images/facebook-page.svg` | Social media page management visual |
| Founder (optional) | `src/assets/images/founder.jpg` (when supplied) | The Well Media House founder — use only where it improves trust |

## Portfolio Images

Organize under `public/gallery/` (initial build) or `src/assets/gallery/` (final assets) by category.

| Item | Path (initial build) | Alt text |
| ---- | -------------------- | -------- |
| Brand Film | `public/gallery/brand-films/brand-film.svg` | Brand film production |
| Product Shoot | `public/gallery/product-photography/product-shoot.svg` | Product photography shoot |
| Client Meeting | `public/gallery/client-meetings/client-meeting.svg` | Strategy client meeting |
| Tourism Campaign | `public/gallery/tourism-accommodation/tourism-campaign.svg` | Tourism marketing campaign |
| Event Coverage | `public/gallery/events/event-coverage.svg` | Event media coverage |

## Image Fallback Rule

If an image is not yet available, use a placeholder in `public/` with descriptive alt text so assets can be replaced without code changes. Update paths in `content.ts`, `services.ts`, or `portfolio.ts` when final assets are added.

---

# SEO

## Primary Keywords

* business growth agency South Africa
* media production company South Africa
* content creation agency South Africa
* website development for small businesses
* social media management South Africa
* marketing strategy for small businesses
* tourism marketing South Africa
* accommodation marketing South Africa
* business growth partner

## Secondary Keywords

* video production for businesses
* product photography South Africa
* business growth consulting
* social media content management
* online store setup South Africa
* event marketing support
* brand awareness strategy
* booking and sales growth
* premium media production
* digital marketing systems

## Geographic Focus

* Country: South Africa
* Region: Eastern Cape and national South African market
* City: Jeffreys Bay, surrounding areas, and businesses across South Africa

## Per-Page Metadata

### Home

* **Title:** The Well Media House | Business Growth, Media Production & Marketing Strategy
* **Description:** The Well Media House helps businesses grow through premium media production, content creation, website development, marketing strategy, and business growth systems.

### About

* **Title:** About The Well Media House | Your Business Growth Partner
* **Description:** Learn how The Well Media House helps businesses build systems, create demand, improve visibility, increase bookings and sales, and grow sustainably.

### Portfolio

* **Title:** Our Work | The Well Media House Portfolio
* **Description:** Explore The Well Media House projects across brand videos, product photography, social media management, tourism campaigns, events, and business growth campaigns.

### Contact

* **Title:** Contact The Well Media House | Book a Business Growth Consultation
* **Description:** Contact The Well Media House to book a consultation and discover how premium media, websites, strategy, and growth systems can help your business grow.

### Services

* **Title:** Services | The Well Media House
* **Description:** Explore content creation, content management, business growth, website development, tourism marketing, event marketing, and launch packages from The Well Media House.

### FAQ

* **Title:** FAQ | The Well Media House
* **Description:** Common questions about consultations, services, packages, and how The Well Media House helps businesses grow.

---

# Copy Tone and Messaging

## Tone

Professional, confident, premium, strategic, growth-focused, and persuasive.

## Messaging Goals

The website must make the visitor feel:

* The Well Media House understands business growth — not just social media posting.
* The team can help increase visibility, bookings, sales, and structure.
* Premium media production and business strategy work together under one partnership.
* The service is flexible and can be phased over time.
* Booking a consultation is the best first step.
* Meaningful growth comes from better systems, stronger content, and smarter strategy.

## Language Preferences

* Preferred phrases: "We build systems designed to support scalable growth." / "Our focus is measurable, scalable growth through better systems, stronger content, and smarter strategy."
* Avoid: "We guarantee exponential growth." / Any absolute guarantee of specific results.
* Do not overpromise guaranteed results — use placeholder stats only when real data is unavailable.
* Use **Silver**, **Gold**, and **Platinum** consistently for plan tiers.
* Do not use Essential, Basic, or Advance.

---

# Config File Mapping

When building, populate config files from the sections above:

| Config file | Source sections in this spec |
| ----------- | --------------------------- |
| `site.ts` | Website Information, Branding |
| `company.ts` | Website Information, Contact Information |
| `navigation.ts` | Navigation |
| `services.ts` | Services |
| `packages.ts` | Packages and Pricing |
| `portfolio.ts` | Portfolio, Featured Work Preview, portfolio detail pages |
| `form.ts` | Contact Form |
| `design.ts` | Extended Design Tokens, Branding — set `enabled: true` for this site |
| `content.ts` | Page section copy, heroes, CTAs, outcomes, process steps |
| `faq.ts` | FAQ |
| `testimonials.ts` | Testimonials |
| `seo.ts` | SEO, Per-Page Metadata |
| `pages.ts` | Page Content Specification |

---

# Additional Requirements

## Business Goals for the Website

The website must:

* Clearly explain the difference between marketing and business growth partnership.
* Showcase premium media production and business strategy together.
* Encourage clients to book a consultation.
* Allow clients to choose service categories and plan levels (Silver, Gold, Platinum).
* Include a visible WhatsApp contact option on every page.
* Showcase previous work through the portfolio system with listing and detail pages.
* Keep the home page simple, spacious, premium, and emotionally persuasive.
* Keep the about page informative, direct, and less visually crowded.

## Approved Visual Direction

Align with approved mockup style:

* Premium dark navy / black background
* Gold accents
* Subtle electric blue highlights
* Cinematic camera visuals
* Business growth imagery
* Rounded corners, soft gradients, clean spacing
* Simple, high-end layout with strong calls to action

---

# Checklist Before Build

* [x] All placeholders replaced or intentionally marked TBD
* [x] Pages Required section completed
* [x] Navigation and CTAs defined
* [x] Services and packages filled in
* [x] Page content sections enabled/disabled per page
* [x] Form fields and dropdown options match services and tiers
* [x] Images listed with paths or placeholder notes
* [x] SEO metadata drafted for each page
* [x] Copy tone and messaging goals defined
* [ ] Social links — to be added when URLs available
* [ ] Form endpoint — confirm FormSubmit activation email after first live submission (`PUBLIC_FORMSUBMIT_EMAIL` optional in `.env`)
* [x] Portfolio images — SVG placeholders in `public/gallery/` until real assets supplied
* [x] Portfolio detail pages — `/portfolio/[slug]` with config-driven content in `portfolio.ts`
* [x] Testimonials — disabled until verified quotes supplied
