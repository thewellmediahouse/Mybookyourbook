# Production30 — Master Product Specification

**Canonical source of truth.** Saved from the complete autonomous build prompt (2026-08-20). Later sessions must reread this file with `CINEYOU_IMPLEMENTATION_PLAN.md`, `CINEYOU_PROGRESS.md`, and `CINEYOU_ARCHITECTURE.md`. Do not rely on chat memory.

Tagline: **Your business, starring you.**

Primary value: Create a professional 30-second business commercial starring you — without a traditional film crew.

Production30 is an automated advertising-production platform. It is NOT a generic AI video generator.

The customer should never need to understand: AI prompting, Seedance, Topaz, inference, models, codecs, FFmpeg, APIs, Cloudflare infrastructure, rendering, upscaling.

Customer experience:

```text
Tell us about your business
↓
Show us who you are
↓
Approve your commercial idea
↓
Production30 produces it
↓
Receive a polished 1080p business advert
```

Underlying pipeline:

```text
Customer
↓
Business / Campaign Brief
↓
AI Creative Director
↓
Customer Concept Approval
↓
Ad Credit Reserved
↓
Seedance 2.5 Reference-to-Video
30 seconds / 480p
↓
Private Cloudflare R2
↓
Topaz Video API
↓
1080p Enhanced Video
↓
Private Cloudflare R2
↓
Cloudflare Media Container
FFmpeg + Branding + Exact Text
↓
Final 1080p MP4
↓
Private Cloudflare R2
↓
Customer Dashboard
```

---

# SECTION A — AUTONOMOUS EXECUTION INSTRUCTIONS

This is the MASTER PRODUCT SPECIFICATION.

Do NOT attempt to blindly write the entire product in one uncontrolled coding pass.

You must first understand the repository and create persistent documentation so development can continue over many Agent sessions without losing context.

## STEP A1 — INSPECT THE REPOSITORY

Before changing anything:

1. Inspect the entire repository.
2. Determine: existing framework, package manager, directory structure, Cloudflare configuration, database, authentication, styling/design system, environment variables, APIs already implemented, existing tests.
3. Preserve working code where sensible.
4. Do not destroy an existing functional project simply to start over.

If this is a blank repository, initialize the application according to this specification.

**Repository decision (2026-08-20):** This workspace was `thewellmediahouse/Mybookyourbook`, an Astro 7 static business template. The operator chose to **replace this repository entirely** with Production30. Git history and the GitHub remote are preserved. Astro/Shopify/template code is removed, not mixed with the SaaS.

## STEP A2 — CREATE PERMANENT PROJECT DOCUMENTATION

Create:

```text
/docs/CINEYOU_MASTER_SPEC.md
/docs/CINEYOU_IMPLEMENTATION_PLAN.md
/docs/CINEYOU_PROGRESS.md
/docs/CINEYOU_ARCHITECTURE.md
/docs/CINEYOU_API_NOTES.md
```

This file is `/docs/CINEYOU_MASTER_SPEC.md`.

## STEP A3 — IMPLEMENTATION PLAN

See `docs/CINEYOU_IMPLEMENTATION_PLAN.md`. Break the project into phases. For each phase document: objective, dependencies, files/modules, database work, external services, security concerns, tests, completion criteria. Use the development order in Section EA.

## STEP A4 — PROGRESS FILE

See `docs/CINEYOU_PROGRESS.md`. Checklist format. Update after EVERY meaningful implementation phase.

## STEP A5 — CONTEXT RECOVERY RULE

Whenever Agent context becomes large or work continues in a new session, reread:

```text
@docs/CINEYOU_MASTER_SPEC.md
@docs/CINEYOU_IMPLEMENTATION_PLAN.md
@docs/CINEYOU_PROGRESS.md
@docs/CINEYOU_ARCHITECTURE.md
```

Do not rely purely on previous conversational memory. The files are authoritative.

## STEP A6 — PHASE COMPLETION RULE

After EACH major phase:

1. run TypeScript checks
2. run lint
3. run relevant unit tests
4. run relevant integration tests
5. build the application
6. test Cloudflare-compatible preview where applicable
7. fix errors introduced
8. update `CINEYOU_PROGRESS.md`
9. create a clear development checkpoint

Do not mark something complete because the UI exists.

A feature counts as complete only if its frontend, backend, authorization, validation, persistence, errors, and required tests are implemented.

## STEP A7 — EXTERNAL API RULE

External APIs may change. Before implementing fal.ai / Seedance, Topaz Labs Video API, Cloudflare Workflows, Cloudflare Containers, Cloudflare R2, Cloudflare D1, Better Auth, Paystack, OpenAI: consult the latest official provider documentation. Do not invent request fields. Do not substitute old or deprecated endpoints merely because they appear in model memory. Log decisions in `CINEYOU_API_NOTES.md`.

## STEP A8 — NO FAKE IMPLEMENTATIONS

Do NOT leave fake functionality behind.

A button must: work, be deliberately disabled with clear explanation, or not exist.

Do not create fake: production progress, payment success, customers, testimonials, revenue, generation results, database actions.

Paid external APIs may remain in MOCK MODE during development, but their real provider adapters must still be implemented.

---

# SECTION B — CORE TECHNOLOGY STACK

Use:

## Application

* latest stable Next.js
* App Router
* React
* TypeScript strict mode
* Tailwind CSS
* shadcn/ui

## Deployment

* Cloudflare Workers
* `@opennextjs/cloudflare`
* Wrangler
* `nodejs_compat`

## Database

* Cloudflare D1
* Drizzle ORM
* Drizzle migrations

## Authentication

* Better Auth
* Better Auth Cloudflare D1 integration

## Media Storage

* private Cloudflare R2

## Long-Running Production

* Cloudflare Workflows

## Background Supporting Tasks

* Cloudflare Queues

## CPU-Heavy Video Processing

* Cloudflare Containers
* FFmpeg
* ffprobe

## AI Creative Direction

* OpenAI via provider abstraction

## Video Generation

* Seedance 2.5 via reAPI

## Upscaling / Enhancement

* Topaz Labs Video API

## Email

* Resend via provider abstraction

## South African Payments

* Paystack

## International Payments

Architecture must support adding Stripe or another international processor later.

DO NOT use Supabase.

DO NOT use PostgreSQL-specific assumptions.

DO NOT store videos in D1.

---

# SECTION C — CLOUDFLARE NEXT.JS SETUP

Configure Next.js for Cloudflare Workers.

Install and configure:

```text
@opennextjs/cloudflare
wrangler
```

Create:

```text
open-next.config.ts
wrangler.jsonc
```

Use:

```json
{
  "compatibility_flags": ["nodejs_compat"]
}
```

Use a current compatibility date.

Package scripts should include approximately:

```json
{
  "dev": "next dev",
  "preview": "opennextjs-cloudflare build && opennextjs-cloudflare preview",
  "deploy": "opennextjs-cloudflare build && opennextjs-cloudflare deploy",
  "cf-typegen": "wrangler types --env-interface CloudflareEnv cloudflare-env.d.ts"
}
```

Generate typed Cloudflare bindings.

Do not assume local Node behavior guarantees Cloudflare production compatibility.

Use the Cloudflare preview runtime as part of validation.

---

# SECTION D — CLOUDFLARE RESOURCES

Configure bindings for:

## D1

Binding: `DB`  
Database: `cineyou-production`

## R2

Binding: `MEDIA_BUCKET`  
Bucket: `cineyou-production`

## Queues

Potential bindings: `NOTIFICATION_QUEUE`, `CLEANUP_QUEUE`

## Workflow

Binding for: `CommercialProductionWorkflow`

## Container

Binding/service for: `MediaProcessingService`

Use current Cloudflare configuration syntax.

---

# SECTION E — AUTHENTICATION

Use Better Auth. Do NOT build password authentication manually.

### Signup

Fields: first name, last name, email, password.

Requirements: email normalization, strong password validation, terms checkbox, privacy checkbox.

### Login

* email/password
* Google OAuth when configured

### Verification

* email verification

### Password Reset

* forgot password
* secure emailed reset token

### Sessions

Customer can view: current session, other active sessions, approximate device/browser information, last activity where available.

Button: **Sign Out Other Sessions**

### Logout

Available throughout dashboard.

---

# SECTION F — GOOGLE AUTH

Environment:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

If not configured: do not render broken Google login controls.

If configured: show **Continue with Google**

---

# SECTION G — TWO-FACTOR AUTH

Prepare architecture for Better Auth-compatible 2FA.

Expose initially for: Admin, Owner, Agency accounts.

Admin users should ultimately be required to use 2FA where possible.

Never write your own insecure OTP system.

---

# SECTION H — USER AUTHORIZATION

Cloudflare D1 does not provide Supabase-style RLS.

Therefore create CENTRALIZED server-side authorization.

Implement:

```ts
requireUser()
requireAdmin()

requireWorkspaceMember(workspaceId)
requireWorkspaceRole(workspaceId, role)

requireBusinessAccess(businessId)
requireProjectAccess(projectId)
requireAssetAccess(assetId)
```

Never rely only on client-side hidden buttons.

Every mutation must verify authorization server-side.

Every query containing user-owned content must be workspace scoped.

---

# SECTION I — WORKSPACE SYSTEM

Build the application around workspaces.

Why: One user may operate one company, operate many companies, manage multiple brands, run an agency.

## workspaces

Fields: `id`, `name`, `slug`, `type`, `owner_user_id`, `country`, `billing_currency`, `plan_code`, `status`, `created_at`, `updated_at`

Types: `BUSINESS`, `AGENCY`

---

# SECTION J — WORKSPACE MEMBERS

Create `workspace_members`.

Fields: `id`, `workspace_id`, `user_id`, `role`, `status`, `invited_by`, `joined_at`, `created_at`

Roles: `OWNER`, `ADMIN`, `CREATOR`, `VIEWER`

### OWNER

Everything including billing, members, deletion, brands, productions.

### ADMIN

Manage brands, members, campaigns, commercial production.

### CREATOR

Can create commercials, edit campaigns, spend available credits where workspace permits.

### VIEWER

Can view, stream, download completed videos. Cannot create, produce, change billing.

---

# SECTION K — FIRST-TIME USER FLOW

After signup:

```text
/signup
↓
verify email if required
↓
/onboarding
```

Onboarding:

```text
Step 1 — Account
Step 2 — Business
Step 3 — Brand
Step 4 — AI Identity
Step 5 — Ready
```

Allow AI Identity setup to be skipped temporarily.

But no actual commercial production may begin without the required identity references and consent where presenter generation is requested.

---

# SECTION L — BUSINESS PROFILE

Create `businesses`.

Fields: `id`, `workspace_id`, `name`, `website`, `industry`, `country`, `city`, `description`, `services`, `target_customer`, `tagline`, `phone`, `email`, `whatsapp`, `primary_color`, `secondary_color`, `default_cta`, `timezone`, `created_at`, `updated_at`

---

# SECTION M — WEBSITE IMPORT

During onboarding provide **Import From Website**.

Build abstraction:

```ts
interface BusinessImporter {
  import(url: string): Promise<BusinessImportResult>
}
```

Imported content must be: visibly reviewed by user, editable, explicitly approved.

Never silently save hallucinated information.

---

# SECTION N — BRAND PROFILE

Route: `/dashboard/brand`

Fields: company name, logo, primary brand colour, secondary brand colour, tagline, phone, email, website, WhatsApp, preferred CTA, default logo position.

Logo lives in R2.

Accept: SVG, PNG, WebP, high-quality JPEG. Keep original version.

---

# SECTION O — MULTIPLE BRANDS

Support workspace-level brand switching.

Example:

```text
The Cool Guy ▼

The Cool Guy
SA Barn Doors
Knot & Grain
+ Add Brand
```

Credits/billing belong to workspace. Commercials belong to business/brand.

---

# SECTION P — PRODUCTION30 BRAND

Company: **Production30**  
Tagline: **Your business, starring you.**

Visual positioning: premium creative agency, cinema production company, elegant SaaS, simple modern interface.

Avoid stereotypical AI visuals. Do NOT use: robots, glowing brains, matrix code, overdone neon, excessive purple gradients, generic AI sparkle graphics.

Suggested palette (logo lock, 2026-08-22; public marketing surfaces 2026-08-24):

```text
Studio background #05070F
Studio surface    #0C1224
Studio text       #F4F6FB
Studio muted      #9AA3B8

Public background #1A2033
Public surface    #1E2538
Public text       #F4F6FB
Public muted      #9AA3B8
Public accent ink #5AA3FF

Accent            #1678FF  (button fill only)
Accent Hover      #2D8CFF
Accent Label      #001038
Accent 2          #5A45FC
```

Blue is the button fill. Public pages must not use `#1678FF` as small text on `#1A2033`. Purple is for the logo mark and loading wheel only — do not flood the UI with purple gradients.

**Contrast lock (2026-08-22, public addendum 2026-08-24):** Studio text-on-background pairs pass WCAG AA 4.5:1. Public marketing/auth (`[data-theme="public"]`) uses frost text on a lifted navy (`#1A2033`), not pure black. Button labels must use `#001038` on `#1678FF`. Do not use white `#FFFFFF` on blue (~4.1:1). Do not use `#1678FF` as body text on the public cinema background (~4.0:1); use `#5AA3FF`.

---

# SECTION Q — LOGO

Create temporary production-ready SVG logo files:

```text
/public/brand/logo.svg
/public/brand/logo-light.svg
/public/brand/icon.svg
```

Wordmark: `PRODUCTION30` — `YOU` may be slightly heavier. A subtle play/frame motif is acceptable. Do not create robot imagery. Must be easy to replace later.

---

# SECTION R — HOMEPAGE

Build premium conversion-focused homepage.

## Hero

Eyebrow: **AI COMMERCIAL PRODUCTION**

Headline:

# Your business.

# Starring you.

Supporting copy:

**Create a professional 30-second business commercial without the traditional film crew. Tell Production30 about your business, show us who you are, and we'll handle the creative direction, production and finishing.**

Primary CTA: **Create My Advert**  
Secondary: **See How It Works**  
Microcopy: **No editing. No prompting. No production experience required.**

---

# SECTION S — HOW IT WORKS

Four steps:

### 01 — Tell Us About Your Business

Answer a few simple questions about your business, offer and customer.

### 02 — Show Us Who You Are

Record a short reference video and provide three guided photos.

### 03 — Approve Your Commercial

Production30 develops the hook, script and scene direction.

### 04 — Receive Your Advert

Your commercial is produced, enhanced, branded and delivered in Full HD.

---

# SECTION T — CORE VALUE PROPOSITION

Section: **A production company in your browser.**

Benefits:

### No Traditional Film Shoot

No cameras, crews, lighting setups or filming days.

### You Stay the Face of the Brand

Commercials are centred around the person customers associate with the business.

### Built Around Advertising Goals

Not just random video generation.

### Full-HD Delivery

Generation occurs efficiently and is professionally enhanced before delivery.

### Accurate Branding

Important logos and written information are added separately rather than trusting generative AI.

---

# SECTION U — PUBLIC ROUTES

Create:

```text
/
/pricing
/how-it-works
/examples

/privacy
/terms
/acceptable-use

/login
/signup
/verify-email
/forgot-password
/reset-password

/onboarding
```

---

# SECTION V — USER DASHBOARD

Route: `/dashboard`

The dashboard should feel like the customer's personal advertising department.

Header: **Welcome back, [First Name].**  
Subheading: **What would you like to create today?**  
Primary button: **+ Create Commercial**

---

# SECTION W — DASHBOARD SUMMARY

Cards:

### Ad Credits

Example dynamic value: `4 available` — never fake numbers.  
CTA: **Buy Credits**

### Commercials

Completed total.

### In Production

Current active jobs.

### Ready

Recently completed.

---

# SECTION X — DASHBOARD COMMERCIALS

Heading: **Your Commercials**

Cards: thumbnail, campaign title, brand, status, date, format, duration.

Menu: View, Duplicate, Create Variation, Rename, Archive, Delete.

Statuses: Draft, Awaiting Approval, Ready to Produce, In Production, Enhancing, Branding, Finalising, Ready, Failed, Archived.

---

# SECTION Y — EMPTY DASHBOARD

New user: **Your first commercial starts here.**

Copy: **Tell us about your business, show us who you are, and Production30 will direct and produce the rest.**

CTA: **Create My First Advert**

Steps: 1. Brief us  2. Approve the concept  3. Receive your commercial

---

# SECTION Z — DASHBOARD NAVIGATION

Desktop: Overview, Create Commercial, Commercials, Brands, AI Identity, Media Library, Credits, Billing, Notifications, Team, Settings, Help.

Profile section: Profile, Sign Out.

Mobile navigation: Home, Commercials, Create, Credits, Account.

Prioritize mobile experience.

---

# SECTION AA — AI IDENTITY

Route: `/dashboard/identity`

Heading: **Your AI Identity**

Copy: **These private references help Production30 maintain your appearance, voice and presentation across your commercials.**

Display: reference video, front photo, left photo, right photo, date created, date updated.

Buttons: Update Identity, Replace Video, Replace Photos, Delete AI Identity.

Identity assets remain private.

---

# SECTION AB — IDENTITY CONSENT

Before identity setup require explicit consent.

Checkbox: **I confirm that I am the person shown and heard in these reference files, or that I have explicit permission from this person to use their likeness and voice for commercial advertising.**

Checkbox: **I understand that these references may be processed by external AI and media-processing services to create my requested commercial.**

Checkbox: **I agree not to use Production30 to impersonate another person without authorization.**

Store: `user_id`, `workspace_id`, `identity_id`, `consent_version`, `accepted_at`, `metadata`

Presenter must be an adult for MVP.

---

# SECTION AC — REFERENCE VIDEO

Require approximately **8–15 seconds**.

Suggested sentence: **“Hi, I'm [name] from [business]. We help our clients get better results through what we do.”**

Instructions: face camera, natural expression, good front lighting, normal speaking voice, quiet room, no music, no filters, no sunglasses, no face obstruction.

Actions: **Record Now** or **Upload Video**. Use MediaRecorder API where supported. Do not request camera/mic permission until user selects Record.

Validate: duration, MIME, size, media readability. Accepted formats should support common mobile formats.

---

# SECTION AD — IDENTITY PHOTOS

Require exactly three:

### Image 1 — Front

**Look directly at the camera.**

### Image 2 — Left angle

**Turn approximately 45° to your left.**

### Image 3 — Right angle

**Turn approximately 45° to your right.**

Requirements: face clear, good light, shoulders visible, one person, no heavy shadows, no filters, no sunglasses.

Logical roles: `IDENTITY_FRONT`, `IDENTITY_LEFT`, `IDENTITY_RIGHT`, `IDENTITY_VIDEO`

Seedance mapping:

```text
@Image1 = front
@Image2 = left
@Image3 = right
@Video1 = presenter video
```

Maintain this mapping consistently.

---

# SECTION AE — MEDIA STORAGE

All user media lives in private Cloudflare R2. Never store video blobs in D1.

Recommended structure:

```text
workspaces/
  {workspaceId}/
    brands/
      {businessId}/
        logo/
        assets/
    users/
      {userId}/
        identity/
          front/
          left/
          right/
          reference-video/
    projects/
      {projectId}/
        references/
        source/
          seedance/
        enhanced/
          topaz/
        final/
          master/
        thumbnails/
```

Use UUID-based object keys. Do not use raw customer filenames as storage authority.

---

# SECTION AF — R2 ACCESS CONTROL

Bucket remains private. Never expose permanent public R2 URLs.

Uploads:

```text
authenticated browser
↓
requests signed upload
↓
server verifies workspace
↓
short-lived signed PUT
↓
direct browser upload to R2
↓
completion confirmation
```

Downloads:

```text
authenticated user
↓
request video
↓
server verifies project access
↓
short-lived signed GET
↓
stream/download
```

Suggested expiration: Uploads 10–20 minutes. Playback/download 15–60 minutes.

Never store signed URL in DB. Store only object key.

---

# SECTION AG — R2 UPLOAD EXPERIENCE

Display: preview, filename, progress, success state, retry, remove.

Direct uploads should avoid routing large video bodies through Worker unnecessarily.

Use multipart upload where useful for larger files. Mobile uploads must be reliable.

---

# SECTION AH — R2 LIFECYCLE

### AI Identity

Until user replaces or deletes it.

### Context References

While project exists.

### Seedance 480p Source

Delete automatically approximately 14 days after successful final production.

### Topaz Intermediate

Delete approximately 14 days after successful final production.

### Final 1080p Commercial

Keep according to customer's account/project retention policy.

### Abandoned Uploads

Delete approximately 24–72 hours later.

Use lifecycle policies or safe cleanup jobs.

---

# SECTION AI — CREATE COMMERCIAL

Route: `/dashboard/create`

Wizard:

```text
1. Campaign
2. Goal
3. Style
4. References
5. Concept
6. Approve
7. Produce
```

Autosave. User can leave and resume.

---

# SECTION AJ — CAMPAIGN STEP

Ask: Which business? (preselect if only one). Campaign title (AI may suggest; user can edit). What are we advertising?

Options: Business, Product, Service, Special offer, Event, Property, Restaurant, New location, Lead generation, Brand awareness, Other.

---

# SECTION AK — CAMPAIGN OBJECTIVE

Ask: What should customers do after watching?

Options: Call, WhatsApp, Visit Website, Book, Buy, Request Quote, Visit Store, Send Enquiry, Learn More.

Ask: Who are we speaking to? What problem do they have? Why should they choose you? Is there an offer? Anything we must avoid saying?

---

# SECTION AL — AD STYLE

Visual cards: Cinematic, Luxury, Professional, High Energy, Emotional, Funny, Social, Corporate.

Then: How should you come across? Multi-select: Confident, Relaxed, Warm, Authoritative, Energetic, Sophisticated, Friendly, Serious, Inspirational.

---

# SECTION AM — PLATFORM / FORMAT

Ask: Where will your advert run?

Options: Instagram/Facebook Reels, TikTok, YouTube, Website, Facebook Feed, Instagram Feed, LinkedIn, Other.

Recommend: 9:16 Vertical, 16:9 Landscape, 1:1 Square. Allow override. Never use ambiguous automatic aspect ratio in paid jobs.

---

# SECTION AN — DURATION

Primary commercial: **30 seconds**. Architecture supports 15, 20, 30 seconds. Main marketed product is 30 seconds.

---

# SECTION AO — ADDITIONAL REFERENCES

Allow optional campaign images: product, office, shop, factory, vehicle, restaurant, property, hotel, equipment, completed work.

MVP maximum: 6 contextual images.

Example mapping:

```text
@Image1 identity front
@Image2 identity left
@Image3 identity right
@Image4 context
@Image5 context
@Image6 context
...
@Video1 presenter reference
```

Prompt builder must know exact mapping.

---

# SECTION AP — AI CREATIVE DIRECTOR

Create `/lib/ai/creative-director/`

```ts
interface CreativeDirectorProvider {
  generateConcept(input: CreativeBrief): Promise<CreativeConcept>;
}
```

Initial provider: OpenAI. Use environment configuration for actual model. Do not couple business logic to a single model name.

Structured output:

```ts
{
  title: string;
  hook: string;
  strategy: string;
  spokenScript: string;
  scenes: [
    {
      startSecond: number;
      endSecond: number;
      visual: string;
      presenterAction?: string;
      camera: string;
      dialogue?: string;
      audio?: string;
    }
  ];
  callToAction: string;
  generationPrompt: string;
}
```

Validate with Zod. If structured response invalid: retry safely.

---

# SECTION AQ — INDUSTRY AD STRATEGIES

Create `/lib/ai/ad-strategies/` including: legal, real-estate, restaurant, hospitality, construction, financial-services, automotive, medical, home-services, ecommerce, retail, software, general.

These provide strategy principles, not hardcoded adverts.

### Legal

Focus: credibility, professionalism, authority, confidence, tasteful office environment. Avoid: guarantees, exaggerated claims, cartoonish courtroom drama.

### Real Estate

Focus: agent, lifestyle, movement, property, aspirational visual storytelling.

### Home Services

Framework: Problem → Expert → Solution → Relief → CTA.

### Hospitality

Focus: arrival, environment, luxury details, sensory experience, lifestyle.

### Financial

Focus: trust, clarity, credibility, professional communication. Never fabricate financial performance.

---

# SECTION AR — CONCEPT APPROVAL

Before spending an Ad Credit, show **Your Commercial Concept**: Hook, Strategy, Your Spoken Words, Scene Timeline (e.g. 0–5, 5–11, 11–18, 18–25, 25–30 sec), CTA.

Buttons: Edit, New Concept, Approve & Produce.

Concept generation/regeneration: **0 credits**. Actual video production: **1 Ad Credit**.

---

# SECTION AS — CREATIVE VERSIONING

When approved store immutable creative version: `version`, `hook`, `strategy`, `spoken_script`, `scenes_json`, `cta`, `seedance_prompt`, `approved_at`, `approved_by`.

If user edits after approval: create a new creative version. Never mutate historical approved creative silently.

---

# SECTION AT — PROMPT BUILDER

Create `/lib/providers/video/seedance/prompt-builder.ts`

Customer does NOT see raw technical prompt.

Identity instruction should include:

**The primary presenter must remain the same adult person represented by @Image1, @Image2, @Image3 and @Video1. Preserve recognisable facial structure, hairstyle, age, skin appearance and body proportions consistently throughout the commercial. Use @Video1 as the primary reference for natural speaking style, facial movement, voice/accent where supported, mannerisms and presentation.**

Then scene timing `0–5 seconds:` etc. Each scene describes: presenter, environment, wardrobe, lighting, action, camera movement, emotional tone, dialogue, sound, continuity.

---

# SECTION AU — ABSOLUTE GENERATED TEXT RULE

Every Seedance generation prompt must include:

**Do not generate subtitles, captions, logos, prices, phone numbers, websites, labels, signs, interface text, banners, watermarks or other important readable written text. Do not invent written words. Important branding and written information will be applied accurately in post-production.**

Where screens/signs appear:

**Keep background signage non-prominent and avoid readable invented text.**

This is mandatory.

---

# SECTION AV — APPROVED DIALOGUE RULE

Once user approves spoken script: Seedance prompt must preserve approved spoken wording. Do not allow later prompt generation to casually rewrite it.

Save: `draft_script`, `approved_script`, `script_version`, `approved_at`.

---

# SECTION AW — SEEDANCE PROVIDER

Create `/lib/providers/video/seedance/`

```ts
interface VideoGenerationProvider {
  submit(input): Promise<ProviderSubmission>;
  getStatus(id): Promise<ProviderStatus>;
  getResult(id): Promise<ProviderResult>;
}
```

Initial provider: Seedance 2.5 via reAPI.

Target model: `doubao-seedance-2.5-face`

Required production settings: `resolution = 480p`, `duration = 30 seconds`, `generate_audio = true`, `size = explicit customer format`.

Use `image_urls` and `video_urls` according to current official API.

Never expose `REAPI_API_KEY` to the browser.

---

# SECTION AX — WHY 480P

Production30 intentionally generates source video at **480p**. This is a cost-control strategy. The customer is NOT delivered the 480p source.

Pipeline: Seedance 480p → Topaz → 1080p → Branding → Customer.

---

# SECTION AY — ASYNCHRONOUS PRODUCTION

Never keep browser waiting on a long request. Use Cloudflare Workflow.

Job submission: customer clicks Produce → server validates → credit reserved → workflow created → browser receives job status page.

---

# SECTION AZ — CLOUDFLARE WORKFLOW

Create **CommercialProductionWorkflow**.

Stages:

```text
Validate project
↓
Validate identity
↓
Validate consent
↓
Reserve credit
↓
Prepare references
↓
Submit Seedance
↓
Wait / poll Seedance
↓
Save 480p result to R2
↓
Submit Topaz job
↓
Upload source to Topaz
↓
Wait / poll Topaz
↓
Save 1080p enhanced file to R2
↓
Send to media Container
↓
Add exact branding
↓
Create thumbnail
↓
Save final MP4 to R2
↓
Mark production COMPLETE
↓
Send notification/email
↓
Queue temporary cleanup
```

Use durable steps. Retry safe stages. Store external request IDs. Avoid duplicate submissions.

---

# SECTION BA — PRODUCTION STATUS

Internal statuses: `DRAFT`, `CONCEPT_GENERATING`, `AWAITING_APPROVAL`, `APPROVED`, `PAYMENT_REQUIRED`, `READY`, `PRODUCTION_STARTING`, `SEEDANCE_QUEUED`, `SEEDANCE_PROCESSING`, `SEEDANCE_COMPLETE`, `TOPAZ_PREPARING`, `TOPAZ_UPLOADING`, `TOPAZ_PROCESSING`, `TOPAZ_COMPLETE`, `BRANDING`, `FINALISING`, `COMPLETE`, `FAILED`, `CANCELLED`.

---

# SECTION BB — CUSTOMER-FACING STATUS LANGUAGE

Never show technical language to ordinary customer.

Map `SEEDANCE_QUEUED` / `SEEDANCE_PROCESSING` to **Filming Your Commercial**.  
Map Topaz stage to **Enhancing Your Footage**.  
Map branding stage to **Adding Your Brand**.  
Map final stage to **Final Checks**.  
Complete: **Your Commercial Is Ready**.

---

# SECTION BC — PRODUCTION PAGE

Route: `/dashboard/commercials/[projectId]/production`

Show stage timeline: Concept Approved, Production, Enhancement, Branding, Delivery.

Copy: **You can leave this page. We'll notify you when your commercial is ready.**

Never fabricate exact completion times. Never show fake percentages unless trustworthy progress is available.

---

# SECTION BD — TOPAZ PROVIDER

Create `/lib/providers/upscale/topaz/`

```ts
interface UpscaleProvider {
  createJob(...)
  upload(...)
  start(...)
  getStatus(...)
  getResult(...)
}
```

Default enhancement model: `prob-4`. Environment: `TOPAZ_DEFAULT_MODEL=prob-4`. Keep configurable.

Target: 1080p. Landscape 1920x1080. Vertical 1080x1920. Square 1080x1080.

---

# SECTION BE — TOPAZ PIPELINE

Implement according to latest Topaz API.

Conceptually: Create request → Accept request → Upload source → Complete upload → Process → Poll → Retrieve completed result.

Support multipart uploads. Do not assume single upload part.

Save: `provider_job_id`, `status`, `result`. Copy completed Topaz file into private R2. Never deliver temporary Topaz URLs directly to customer.

---

# SECTION BF — MEDIA PROCESSING CONTAINER

Create Cloudflare media processing service/container with FFmpeg and ffprobe.

Responsibilities: Inspect media (width, height, duration, FPS, codecs, container, file size). Final branding (exact logo, CTA, phone, website, WhatsApp, optional outro). Thumbnail (poster frame). Final export: MP4, H.264, AAC, 1080p, web-compatible, fast-start.

Protect container endpoint/service. No public arbitrary FFmpeg endpoint.

---

# SECTION BG — EXACT BRANDING

AI generates cinematic footage. Production30 adds important written information afterward.

### Logo

none, top-left, top-right, bottom-left, bottom-right. Default: bottom-right. Maintain aspect ratio.

### End Card

Optional 2–3 seconds: LOGO, Call Now / Book Now / Get A Quote, Phone, WhatsApp, Website.

All data comes from structured business profile. No generated gibberish.

---

# SECTION BH — FINAL OUTPUT

Deliver: MP4, H.264, AAC, 1080p.

Store metadata: width, height, duration, fps, video_codec, audio_codec, size_bytes, r2_object_key, completed_at.

Sanitized filename: `cineyou-{business}-{campaign}-1080p.mp4`

---

# SECTION BI — COMMERCIAL DETAIL PAGE

Route: `/dashboard/commercials/[projectId]`

Display: large video player, title, brand, date, format, duration, objective, CTA.

Actions: Download 1080p, Create Variation, Duplicate, Create Vertical Version, Create Landscape Version.

Secondary: Archive, Delete.

---

# SECTION BJ — FORMAT VARIATIONS

If customer changes from landscape to vertical: Do not simply crop automatically and claim equivalent quality.

Explain: **A new aspect ratio requires a new AI production and uses 1 Ad Credit.**

Allow separate creative adaptation for format.

---

# SECTION BK — CREATE ANOTHER VERSION

Completed advert page: **Create Another Version**

Options: Funnier, More Professional, More Luxurious, Stronger Sales Hook, More Emotional, Different Environment, New Opening, Custom Change.

Creating concept: free. Running new video production: 1 credit.

---

# SECTION BL — MEDIA LIBRARY

Route: `/dashboard/media`

Tabs: Logos, Products, Business, Locations, Campaign References.

Allow reuse across future commercials. Do NOT mix AI Identity assets into ordinary media library.

---

# SECTION BM — CREDIT SYSTEM

Customer-facing term: **Ad Credits**

Definition: **1 Ad Credit = 1 new AI commercial production.** Concept editing does not use credits.

## credit_wallets

`workspace_id`, `balance`, `updated_at`

## credit_transactions

`id`, `workspace_id`, `amount`, `type`, `project_id` nullable, `payment_id` nullable, `idempotency_key`, `description`, `created_at`

Types: `PURCHASE`, `SUBSCRIPTION_GRANT`, `GENERATION`, `TECHNICAL_REFUND`, `PROMOTION`, `ADMIN_ADJUSTMENT`, `EXPIRY`

---

# SECTION BN — CREDIT ATOMICITY

Do not implement read balance / if > 0 / update.

Use safe D1 conditional mutation:

```sql
UPDATE credit_wallets
SET balance = balance - 1
WHERE workspace_id = ?
AND balance >= 1;
```

Verify affected rows. Use unique `idempotency_key` for generation requests. Prevent double-click double-spend.

---

# SECTION BO — TECHNICAL FAILURE

Failure types: `TECHNICAL`, `USER_INPUT`, `CONTENT_REJECTED`, `CREATIVE_PREFERENCE`

Technical examples: provider error, corrupt generated file, Topaz error, processing crash. May receive automatic credit refund.

Creative dissatisfaction (change clothes, office, acting, different hook after generation) requires another credit.

Never offer unlimited rerenders.

---

# SECTION BP — SOUTH AFRICAN PRICING

Seed initial plans:

| Plan | Price | Credits |
| --- | --- | --- |
| First Commercial | R599 | 1 Ad Credit (introductory) |
| Single Commercial | R799 | 1 Credit |
| Starter | R1,499/month | 2 Credits |
| Business | R3,499/month | 5 Credits |
| Growth | R5,999/month | 10 Credits |
| Agency | Custom | — |

Store pricing in database. Do not hardcode prices into every component.

---

# SECTION BQ — INTERNATIONAL PRICING

| Plan | Price | Credits |
| --- | --- | --- |
| Single | $49 | 1 Credit |
| Starter | $89/month | 2 Credits |
| Business | $199/month | 5 Credits |
| Growth | $349/month | 10 Credits |
| Agency | From $699/month | — |

Admin configurable.

---

# SECTION BR — PRICING REGION

Use billing country as main authority. IP may suggest region but must not permanently decide account pricing. Allow country/region selection when appropriate.

---

# SECTION BS — PRICING PAGE

Route: `/pricing`

Explain: **What is an Ad Credit?** One Ad Credit starts one new AI commercial production. Concept and script changes before production do not use a credit.

Highlight Business plan. Never advertise unlimited generation or unlimited revisions.

---

# SECTION BT — PAYMENTS

```ts
interface PaymentProvider {
  createCheckout(input)
  verifyPayment(reference)
  createSubscription(input)
  cancelSubscription(id)
  handleWebhook(request)
}
```

Initial provider: Paystack. Use test environment first. Never trust frontend redirect parameters for successful payment. Credits are granted only after verified provider confirmation.

---

# SECTION BU — BILLING DATA

## plans

`id`, `code`, `name`, `region`, `currency`, `amount_minor`, `credits`, `interval`, `active`, `metadata_json`

## subscriptions

`id`, `workspace_id`, `plan_id`, `provider`, `provider_customer_id`, `provider_subscription_id`, `status`, `period_start`, `period_end`, `cancel_at_period_end`, `created_at`, `updated_at`

## payments

`id`, `workspace_id`, `provider`, `provider_reference`, `currency`, `amount_minor`, `status`, `metadata_json`, `created_at`, `updated_at`

## payment_events

For idempotency/audit.

---

# SECTION BV — BILLING PAGE

Route: `/dashboard/billing`

Show: Current Plan, Credits Available, Next Billing Date, Payment Method, Billing History, Credit History.

Actions: Buy Credits, Upgrade, Downgrade, Cancel Subscription.

Invoices/receipts only when actually generated.

---

# SECTION BW — NOTIFICATIONS

Route: `/dashboard/notifications`

Create `notifications`: `id`, `user_id`, `workspace_id`, `type`, `title`, `body`, `action_url`, `read_at`, `created_at`

Examples: Commercial ready, Production failed, Credit refunded, Low credits, Payment successful, Subscription updated, Team invite.

Notification icon in dashboard header.

---

# SECTION BX — EMAILS

Send transactional email for: Welcome, Verify Email, Password Reset, Commercial Ready (subject **Your Production30 commercial is ready**, button **View My Commercial**), Production Failure (customer-friendly language), Payment Receipt, Team Invitation.

Never attach giant videos.

---

# SECTION BY — CLOUDFLARE QUEUES

Use Queues where appropriate for: emails, notification delivery, cleanup, other non-critical async side effects.

Main commercial production remains Cloudflare Workflow. Do not unnecessarily overengineer queues.

---

# SECTION BZ — TEAM PAGE

Route: `/dashboard/team`

Show: name, email, role, status, joined date.

OWNER/ADMIN can invite: email, role. Invitations expire. Role changes logged.

---

# SECTION CA — AGENCY MODE

Architecture must support Agency accounts.

Agency may: add multiple client brands, create adverts for different clients, invite team, maintain authorised presenter identities, share/export finished videos.

A full client portal may remain post-MVP. Schema must not block future client portal development.

---

# SECTION CB — PROFILE SETTINGS

Route: `/dashboard/settings/profile`

Fields: first name, last name, email, profile image, timezone, country.

Email changes require verification.

---

# SECTION CC — SECURITY SETTINGS

Route: `/dashboard/settings/security`

Include: Password, Two-Step Verification, Active Sessions, Sign Out Other Sessions, Connected Accounts.

---

# SECTION CD — NOTIFICATION SETTINGS

Route: `/dashboard/settings/notifications`

Preferences: Production complete email ON, Production failure email ON, Billing email ON, Marketing email OFF unless consented, Product updates configurable.

Transactional notifications remain enabled as necessary.

---

# SECTION CE — ACCOUNT SETTINGS

Route: `/dashboard/settings/account`

Include: Export My Data, Delete AI Identity, Delete Account.

Deletion should require: re-authentication where appropriate, clear confirmation, typed confirmation for account deletion.

Deletion workflow: cancel subscription if needed → revoke sessions → schedule private R2 deletion → remove identity → remove projects according to policy → remove memberships → retain legally required financial records only.

---

# SECTION CF — HELP & SUPPORT

Route: `/dashboard/help`

Articles: Getting Started, Creating a Good Reference Video, Taking Reference Photos, Understanding Ad Credits, Why Branding Is Added Afterwards, Downloading Your Video.

Support form: category, subject, message, project_id optional. Create support ticket table.

---

# SECTION CG — DATABASE

Use D1-compatible Drizzle schema.

At minimum create: Better Auth tables, profiles, workspaces, workspace_members, workspace_invitations, businesses, brand_assets, presenter_identities, identity_assets, assets, projects, project_references, creative_versions, production_jobs, production_events, generation_attempts, credit_wallets, credit_transactions, plans, subscriptions, payments, payment_events, notifications, support_tickets, consents, audit_logs, app_settings, prompt_framework_versions.

---

# SECTION CH — ASSETS TABLE

```text
assets
id
workspace_id
owner_user_id
business_id nullable
project_id nullable
category
role
r2_object_key
mime_type
size_bytes
width nullable
height nullable
duration_seconds nullable
fps nullable
status
created_at
updated_at
deleted_at nullable
```

Do not store presigned URLs.

---

# SECTION CI — PROJECT TABLE

```text
projects
id
workspace_id
business_id
created_by_user_id
title
objective
target_customer
problem
value_proposition
offer
cta_type
cta_value
style
tone_json
platform
aspect_ratio
duration
status
current_creative_version_id
created_at
updated_at
deleted_at nullable
```

---

# SECTION CJ — CREATIVE VERSIONS TABLE

```text
creative_versions
id
project_id
version
hook
strategy
spoken_script
scenes_json
call_to_action
seedance_prompt
approved_at nullable
approved_by nullable
created_at
```

---

# SECTION CK — PRODUCTION JOBS

```text
production_jobs
id
workspace_id
project_id
creative_version_id
workflow_instance_id
status
video_provider
video_provider_job_id
upscale_provider
upscale_provider_job_id
source_asset_id nullable
enhanced_asset_id nullable
final_asset_id nullable
credit_transaction_id nullable
attempt_number
estimated_provider_cost_usd nullable
actual_provider_cost_usd nullable
failure_type nullable
failure_code nullable
internal_failure_message nullable
customer_failure_message nullable
started_at
completed_at
created_at
updated_at
```

---

# SECTION CL — PRODUCTION EVENTS

Append-only table `production_events`.

Events: `JOB_CREATED`, `CREDIT_RESERVED`, `SEEDANCE_SUBMITTED`, `SEEDANCE_COMPLETE`, `SOURCE_SAVED`, `TOPAZ_SUBMITTED`, `TOPAZ_COMPLETE`, `ENHANCED_SAVED`, `BRANDING_STARTED`, `FINAL_SAVED`, `COMPLETE`, `FAILED`, `CREDIT_REFUNDED`.

Useful for debugging.

---

# SECTION CM — GENERATION ATTEMPTS

Store every actual generation attempt: `id`, `project_id`, `job_id`, `attempt_number`, `provider`, `provider_request_id`, `creative_version_id`, `credit_transaction_id`, `reason`, `result`, `created_at`.

---

# SECTION CN — AUDIT LOG

Track important actions: Admin credit adjustments, User suspension, Member role changes, Plan/pricing changes, Technical refunds, Identity deletion, Account deletion, Payment manual review.

Never log passwords, raw tokens or secrets.

---

# SECTION CO — ADMIN

Route: `/admin`

Strict admin access.

Navigation: Overview, Users, Workspaces, Commercials, Production Jobs, Failed Jobs, Payments, Subscriptions, Credits, Pricing, Prompt Frameworks, AI Settings, Storage, Support, System, Audit Log.

---

# SECTION CP — ADMIN OVERVIEW

Cards: Users, Paying Workspaces, Commercials Produced, Active Jobs, Failed Jobs, Revenue, Credits Sold, Estimated AI Cost, Estimated Gross Margin, Approx R2 Storage.

No fake data in live production.

---

# SECTION CQ — ADMIN USERS

View: user, email, workspaces, account status, plan, credits, projects, payments, jobs, support tickets.

Actions: Suspend, Unsuspend, Grant Credit, Deduct Credit, initiate password reset process.

Admin can never view passwords.

---

# SECTION CR — ADMIN JOB DETAIL

Show: customer, workspace, business, project, creative version, internal prompt, Seedance request ID, Topaz request ID, workflow ID, R2 assets, production events, provider error, credit transaction.

Actions: Retry Current Stage, Mark Technical Failure, Refund Credit, Cancel, Download Source.

All downloads via temporary authorized URLs.

---

# SECTION CS — ADMIN PRICING

Editable: price, currency, credits, billing interval, introductory offer, active status.

Changing plan price does not alter historical transaction data.

---

# SECTION CT — ADMIN AI SETTINGS

Editable non-secret configuration: Creative Director provider/model, Video provider, Seedance model ID, Seedance source resolution, Default duration, Topaz model, Final resolution, Maximum context references, Failure/refund rules.

Never store provider secret API keys in D1 admin settings.

---

# SECTION CU — ADMIN STORAGE

Display: number of R2 assets, approximate stored bytes, final videos, identity assets, temporary files, items pending deletion.

Safe action: **Run Cleanup** — triggers controlled cleanup workflow/queue. Do not build arbitrary unrestricted bucket deletion interface.

---

# SECTION CV — ADMIN SUPPORT

View support tickets: customer, subject, category, project, status, created date.

Statuses: `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.

---

# SECTION CW — COST TRACKING

For every production record: estimated Seedance cost, actual Seedance cost if exposed, Topaz estimated/actual cost if exposed, OpenAI cost estimate, payment fee, storage size, media-processing estimate.

Admin gross margin estimate: Revenue − AI costs − payment costs − estimated infrastructure = Estimated Gross Margin.

---

# SECTION CX — MOCK MODE

Critical requirement.

```env
AI_PROVIDER_MODE=mock
```

Mock mode must allow complete application testing without paid calls.

Flow: signup → onboarding → identity → campaign → concept → approval → credit → simulated Seedance → simulated Topaz → simulated branding → completed video fixture.

No paid API calls.

---

# SECTION CY — LIVE MODE

```env
AI_PROVIDER_MODE=live
```

Only live mode calls actual Seedance, Topaz, OpenAI. Protect production environment carefully.

---

# SECTION CZ — PAYMENT TEST MODE

```env
PAYMENTS_MODE=test
```

Never accidentally create live transactions from development. Clearly distinguish test/live.

---

# SECTION DA — ENVIRONMENT FILE

Create `.env.example` approximately:

```env
NEXT_PUBLIC_APP_NAME=Production30
NEXT_PUBLIC_APP_URL=http://localhost:3000

BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

OPENAI_API_KEY=
OPENAI_MODEL=
LLM_PROVIDER=openai

REAPI_API_KEY=

TOPAZ_API_KEY=
TOPAZ_DEFAULT_MODEL=prob-4

PAYFAST_MODE=sandbox
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=

PAYONEER_MODE=sandbox
PAYONEER_USERNAME=
PAYONEER_TOKEN=

PAYSTACK_PUBLIC_KEY=
PAYSTACK_SECRET_KEY=

RESEND_API_KEY=
EMAIL_FROM=Production30 <Accounts@production30.com>

AI_PROVIDER_MODE=mock
CONCEPT_AI_MODE=mock
PAYMENTS_MODE=test

ADMIN_EMAILS=
INTERNAL_SERVICE_SECRET=
```

Cloudflare-native resources should use bindings when appropriate. Never expose secret values to client-side environment variables.

---

# SECTION DB — CLOUDFLARE SECRETS

Production API secrets must be stored using Cloudflare secret configuration.

Never commit: `REAPI_API_KEY`, `TOPAZ_API_KEY`, `OPENAI_API_KEY`, `PAYONEER_TOKEN`, `PAYFAST_MERCHANT_KEY`, `PAYFAST_PASSPHRASE`, `PAYSTACK_SECRET_KEY`, `BETTER_AUTH_SECRET`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`.

---

# SECTION DC — RATE LIMITING

Protect: signup, login, password reset, website import, concept generation, signed upload generation, checkout, production start, webhook routes.

Production endpoint is particularly important because it incurs real AI cost.

---

# SECTION DD — WEBHOOK SECURITY

For provider webhooks: verify signatures, store event record, enforce idempotency.

Duplicate webhook must NOT: grant credits twice, start workflow twice, refund twice, mark duplicate completion, send duplicate critical emails.

---

# SECTION DE — CONTENT / IDENTITY SAFETY

Production30 is for authorized business advertising.

Do not create features encouraging: celebrity impersonation, public cloning library, anonymous third-party impersonation, public searchable faces.

Require: authenticated account, consent, ownership/authorization.

Allow abuse reporting. Admins can suspend accounts.

---

# SECTION DF — PRIVACY DOCUMENTS

Create `/privacy`, `/terms`, `/acceptable-use`.

Initial wording should be clearly marked: **Requires professional legal review before launch.**

Do not falsely claim attorney-reviewed terms.

Explain that media may be processed through: AI video provider, video enhancement provider, cloud hosting/storage, payment provider, email provider.

---

# SECTION DG — MOBILE UX

Most users may capture identity through phones.

Mobile priority: signup, login, onboarding, camera, video recording, photo capture, uploads, campaign wizard, concept approval, payments, production tracking, video playback, download.

Large touch targets. Avoid desktop-only modals.

---

# SECTION DH — ACCESSIBILITY

Implement: semantic HTML, labelled inputs, keyboard navigation, focus states, accessible dialogs, sufficient contrast, useful validation messages.

---

# SECTION DI — ERROR MESSAGES

Never show raw provider errors.

Bad: `FAL_BAD_REQUEST: INVALID_VIDEO_URL`

Good: **We couldn't complete this production. Your Ad Credit has not been lost. Please try again or contact support.**

Store technical details internally.

---

# SECTION DJ — UI LANGUAGE

Never say to customer: Generate with Seedance. Say: **Produce Commercial**.

Never say: Topaz Upscale. Say: **Enhancing Your Footage**.

Never say: LLM Prompt. Say: **Commercial Concept**.

Never say: Inference. Say: **Production**.

Technology remains behind the curtain.

---

# SECTION DK — ANALYTICS

Create analytics provider abstraction.

Track: signup_started, signup_completed, onboarding_started, onboarding_completed, identity_started, identity_completed, commercial_started, brief_completed, concept_generated, concept_regenerated, concept_approved, checkout_started, payment_completed, production_started, seedance_completed, enhancement_completed, branding_completed, production_completed, production_failed, commercial_viewed, commercial_downloaded, variation_started.

Do not tie business logic directly to one analytics provider.

---

# SECTION DL — PUBLIC SEO

Homepage title: **Production30 — Professional AI Business Commercials**

Description: **Create a professional business video advert starring you. Brief Production30 about your business, provide your references, approve the concept and receive a finished Full-HD commercial.**

Create: metadata, favicon, OpenGraph, sitemap, robots.txt.

Do not promise guaranteed sales.

---

# SECTION DM — FAQ

### Do I need editing experience?

No.

### What do I need?

A short reference video, three clear photographs and information about your business.

### What quality is delivered?

Full HD 1080p after enhancement and finishing.

### Can I make another version?

Yes. Each new production uses another Ad Credit.

### Why isn't my phone number generated inside the AI scene?

Important branding and written information are added separately so they remain accurate.

### Can another person be the presenter?

Only if you have explicit authorization.

### Do I need to keep the browser open?

No. Production30 will notify you when production is complete.

---

# SECTION DN — APPLICATION ROUTES

Use roughly:

```text
/
/pricing
/how-it-works
/examples
/privacy
/terms
/acceptable-use
/login
/signup
/verify-email
/forgot-password
/reset-password
/onboarding
/dashboard
/dashboard/create
/dashboard/commercials
/dashboard/commercials/[id]
/dashboard/commercials/[id]/production
/dashboard/brand
/dashboard/brands
/dashboard/identity
/dashboard/media
/dashboard/credits
/dashboard/billing
/dashboard/notifications
/dashboard/team
/dashboard/settings
/dashboard/settings/profile
/dashboard/settings/security
/dashboard/settings/notifications
/dashboard/settings/account
/dashboard/help
/admin
/admin/users
/admin/workspaces
/admin/commercials
/admin/jobs
/admin/jobs/[id]
/admin/payments
/admin/subscriptions
/admin/credits
/admin/pricing
/admin/prompts
/admin/ai
/admin/storage
/admin/support
/admin/audit
```

---

# SECTION DO — INTERNAL API / SERVER ROUTES

Approximately:

```text
/api/auth/[...all]
/api/uploads/create
/api/uploads/complete
/api/creative/generate
/api/creative/approve
/api/projects
/api/projects/[id]
/api/production/start
/api/production/[id]/status
/api/media/[assetId]/play
/api/media/[assetId]/download
/api/billing/checkout
/api/billing/subscription
/api/billing/cancel
/api/webhooks/fal
/api/webhooks/payoneer
/api/webhooks/payfast
/api/webhooks/paystack
/api/team/invite
/api/team/invite/accept
/api/support
/api/admin/jobs/[id]/retry
/api/admin/jobs/[id]/refund
/api/admin/credits
```

Use Server Actions where cleaner and secure. Do not create API endpoints merely for convention.

---

# SECTION DP — TESTS: AUTH

Test: anonymous cannot access dashboard; logged-in user cannot access another workspace; VIEWER cannot start production; CREATOR cannot manage owner billing; suspended user cannot start production; admin pages require admin role.

---

# SECTION DQ — TESTS: R2

Test: upload requires authentication; user cannot upload into another workspace; download requires project access; identity inaccessible to unrelated user; no permanent public URL returned; deletion queues correct cleanup.

---

# SECTION DR — TESTS: CREDITS

Test: zero credits blocks production; one generation consumes one credit; double-click consumes once; duplicate idempotency key cannot consume twice; technical failure refunds once; duplicate refund impossible; variation production uses another credit.

---

# SECTION DS — TESTS: PAYMENT

Test: frontend redirect cannot grant credits; verified payment grants correct package; duplicate webhook does not double-credit; wrong amount rejected; wrong currency rejected; subscription allocation correct.

---

# SECTION DT — TESTS: WORKFLOW

Success test: Seedance success → R2 → Topaz success → R2 → Branding success → Final R2 → COMPLETE.

Failure tests: Seedance failure, Topaz failure, branding failure, upload failure, notification failure.

Workflow must safely resume where appropriate.

---

# SECTION DU — TESTS: PROMPT BUILDER

Verify: Image1 front, Image2 left, Image3 right, Video1 presenter, approved dialogue preserved, correct aspect ratio, correct duration, advertising style included, contextual reference mapping correct, no-generated-text instruction always present.

---

# SECTION DV — TESTS: TOPAZ

Mock: create, accept, upload, multipart upload, complete upload, poll, complete, retrieve, R2 save.

---

# SECTION DW — TESTS: ACCOUNT DELETION

Verify: sessions revoked, identity scheduled for deletion, private R2 assets handled, subscription cancelled correctly, required payment records retained, account cannot log in afterward.

---

# SECTION DX — TESTS: SECURITY

Verify: secrets absent from browser bundle; direct unauthorized asset access blocked; webhook signature failures rejected; duplicate jobs prevented; upload content validated; admin endpoints protected; customer A cannot access customer B data.

---

# SECTION DY — README

Create thorough `README.md` including: product overview, technology stack, architecture, Cloudflare Workers, OpenNext, D1, Drizzle, Better Auth, R2, Workflows, Queues, Containers, Seedance, Topaz, OpenAI, Paystack, Resend, environment variables, local setup, mock mode, tests, deployment, migration commands, common issues, production checklist.

---

# SECTION DZ — ARCHITECTURE DIAGRAM

See `docs/CINEYOU_ARCHITECTURE.md` (mermaid flowchart).

---

# SECTION EA — DEVELOPMENT ORDER

Implement in this order. Phases 1–25 are detailed in `docs/CINEYOU_IMPLEMENTATION_PLAN.md`.

1. Repository / Foundation  
2. D1 / Drizzle  
3. Better Auth  
4. Workspaces / Roles  
5. Public Site  
6. Dashboard  
7. Business / Brand  
8. AI Identity  
9. Media Library  
10. Commercial Wizard  
11. Creative Director  
12. Prompt Builder  
13. Credits  
14. Pricing / Paystack  
15. Cloudflare Workflow (mock first)  
16. Seedance 2.5  
17. Topaz  
18. Cloudflare Container / FFmpeg  
19. Customer Delivery  
20. Notifications  
21. Team / Agency  
22. Admin  
23. Security / Privacy  
24. Testing / Hardening  
25. Cloudflare Production Verification  

---

# SECTION EB — AFTER EACH PHASE

Automatically: run TypeScript, lint, tests, relevant build/preview, fix errors, update `CINEYOU_PROGRESS.md`, record architecture/API notes if new decisions were made, proceed to next phase.

Do not repeatedly ask the human to confirm routine implementation decisions. Use the specification as authority. Ask only when there is a genuinely blocking business decision that cannot reasonably be inferred.

---

# SECTION EC — IF CONTEXT GETS TOO LARGE

STOP relying on conversation history. Read the five `docs/CINEYOU_*.md` files. Then continue from first unfinished requirement.

---

# SECTION ED — USER EXPERIENCE TEST

At every customer-facing decision ask: **Could a 55-year-old business owner with no knowledge of AI understand this without phoning us?** If not: simplify.

Never ask: Enter your AI prompt. Ask: **What do you want customers to understand?**

Never ask: Choose your Seedance settings. Ask: **Where will you advertise this video?**

Never ask: Upload multimodal references. Say: **Show us who you are.**

Never ask: Run Topaz upscale? Simply do it.

---

# SECTION EE — CORE CUSTOMER PERCEPTION

The user should think:

```text
I told Production30 what I sell.
I showed Production30 what I look and sound like.
Production30 created the advert idea.
I approved it.
Production30 produced it.
I downloaded my professional commercial.
```

They should NOT think: I configured several AI APIs.

---

# SECTION EF — NON-NEGOTIABLE TECHNICAL REQUIREMENTS

Do NOT change these unless explicitly instructed:

| Item | Value |
| --- | --- |
| Product | Production30 |
| Tagline | Your business, starring you. |
| Primary video generator | Seedance 2.5 reference-to-video |
| Seedance source quality | 480p |
| Primary duration | 30 seconds |
| Enhancement provider | Topaz Labs Video API |
| Default Topaz model | prob-4 (configurable) |
| Final delivery | 1080p Full HD |
| Storage | Private Cloudflare R2 |
| Application database | Cloudflare D1 |
| ORM | Drizzle |
| Hosting | Cloudflare Workers |
| Long-running jobs | Cloudflare Workflows |
| Heavy media work | Cloudflare Containers + FFmpeg |
| Authentication | Better Auth + D1 |
| Initial SA payments | Paystack |

Important branding is applied programmatically after AI generation. Never trust Seedance for logo, phone, website, pricing, CTA text, or exact written information.

---

# SECTION EG — FINAL ACCEPTANCE CHECKLIST

Before declaring Production30 complete, verify every item in the original prompt’s Section EG covering: Application, Auth, Workspace, Dashboard, Identity, Creative, Credits, Payments, Generation, Workflow, Topaz, Branding, Delivery, Admin, Security, Testing.

---

# SECTION EH — FINAL DEVELOPMENT DIRECTIVE

Do not merely scaffold Production30. Build the working product.

Do not stop after generating UI shells. Do not leave expensive integrations unsecured. Do not expose provider secrets. Do not store video blobs in D1. Do not allow public access to identity assets. Do not double-charge credits. Do not trust payment redirect parameters. Do not create permanent public media URLs. Do not ask Seedance to spell business information. Do not silently substitute another video model. Do not mark mock behavior as a finished production integration.

Use mock mode while developing, but implement the real provider adapters.

Continue through the implementation phases autonomously. When one phase is complete: test it, document it, update progress and proceed. If context is lost: reread the project documentation and continue.

Build Production30 as a serious commercial SaaS platform capable of serving real paying South African and international businesses.

# FINAL PRODUCT

## Production30

### Your business, starring you.

The user provides: Business, Goal, Identity, References.

Production30 provides: Strategy, Hook, Script, Creative Direction, Commercial Production, Video Enhancement, Accurate Branding, 1080p Delivery.

The end result must feel like: **An advertising agency and production company inside a website.**
