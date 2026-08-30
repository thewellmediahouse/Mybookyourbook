# Production30 Development Progress

Authoritative checklist. A feature is complete only if frontend, backend, authorization, validation, persistence, errors, and required tests are implemented. Do not mark complete because UI exists.

Last updated: 2026-08-30 (reference video upload keys)

## Foundation
- [x] Next.js
- [x] OpenNext Cloudflare
- [x] Wrangler
- [x] D1
- [x] Drizzle
- [x] R2
- [x] Tailwind + shadcn/ui
- [x] Production30 design tokens
- [x] Temporary brand SVGs
- [x] `.env.example`
- [x] Cloudflare preview build

## Authentication
- [x] Better Auth
- [x] Signup
- [x] Login
- [x] Email verification
- [x] Password reset
- [x] Google OAuth
- [x] Sessions
- [x] 2FA architecture

## User Experience
- [x] Dashboard
- [x] Onboarding
- [x] Brand profile
- [x] AI Identity
- [x] Media library
- [x] Team invites
- [x] Agency brands (no client portal)

## Commercial Creation
- [x] Campaign wizard
- [x] Creative Director
- [x] Industry strategies
- [x] Concept approval
- [x] Seedance prompt builder

## Video Pipeline
- [x] Seedance 480p
- [x] Workflow
- [x] R2 source storage
- [x] Topaz 1080p
- [x] FFmpeg branding
- [x] Final video
- [x] Download

## Commerce
- [x] Credits
- [x] Pricing
- [x] Paystack
- [x] Subscriptions
- [x] Billing

## Admin
- [x] User management
- [x] Jobs
- [x] Pricing
- [x] AI settings
- [x] Credits
- [x] Support
- [x] Audit logs

## Security
- [x] Authorization
- [x] Upload security
- [x] Signed URLs
- [x] Rate limiting
- [x] Webhook security
- [x] Consent
- [x] Account deletion

## Deployment
- [x] Mock mode
- [x] Tests
- [x] Cloudflare preview
- [x] Production deploy

## Documentation
- [x] `docs/CINEYOU_MASTER_SPEC.md`
- [x] `docs/CINEYOU_IMPLEMENTATION_PLAN.md`
- [x] `docs/CINEYOU_PROGRESS.md`
- [x] `docs/CINEYOU_ARCHITECTURE.md`
- [x] `docs/CINEYOU_API_NOTES.md`
- [x] README (product + local setup)

## Session log

### 2026-08-20 — Session 1

Replaced the Astro business template with CineYou documentation and Phase 1 Next.js / OpenNext foundation.

Completed:

- Five canonical docs + Cursor rule `.cursor/rules/cineyou.mdc`
- Astro/Shopify/template source removed; old docs in `docs/_archive-astro-template/`
- Next.js 16 App Router, Tailwind v4, shadcn Button, cinema tokens
- OpenNext Worker `cineyou`, D1/R2 bindings declared
- Hero + How it works. Signup CTA disabled until Phase 3

Verification: check, lint, build, OpenNext preview (`GET /` and `/how-it-works` 200).

### 2026-08-20 — Phase 2

D1-compatible Drizzle schema for all CG–CN tables (31), local migration, ZA/INT plan seed.

Verification:

- `npm run db:verify` — 31 tables
- `npm run db:migrate:local` — `0000_fair_radioactive_man.sql` applied
- `npm run db:seed:local` — 11 plans (ZA + INT list prices)
- `npm run check`, `npm run lint`, `npm run build`

No fake users. Remote D1 still uses placeholder `database_id`.

### 2026-08-20 — Phase 3

Better Auth 1.7.1 on D1/Drizzle. Email/password signup, login, logout, verification, password reset, session list, **Sign Out Other Sessions**. Google button only when both OAuth env vars are set. Email uses mock `console.info` unless Resend is configured.

Verification:

- `npm test` — password helpers, dashboard cookie guard, signup → verify → session cookie → reset token → sign-in
- `npm run check`, `npm run lint`, `npm run build`
- Migrations `0001_daffy_clea.sql` (user first/last name) and `0002_misty_johnny_storm.sql` (account `issuer` + unique identity index)

Notes:

- Terms/privacy are honest placeholders marked **Requires professional legal review before launch.**
- 2FA is architecture-only (`better-auth/plugins.twoFactor` later). No custom OTP.
- Workspace onboarding is Phase 4. `/dashboard` is an authenticated welcome shell so auth guards can be tested; the studio dashboard is not built yet.

### 2026-08-20 — Phase 4

Workspaces, memberships, roles, onboarding, and centralized `require*` helpers.

- New studio: workspace + OWNER membership + brand + zero-credit wallet
- Roles: OWNER billing only; VIEWER cannot produce; suspended member/workspace cannot produce
- Cross-workspace business/project/asset reads fail
- `/onboarding` five steps; identity skip required to continue; website import interface does not invent details
- Studio switcher when a user belongs to more than one workspace
- `/admin` is staff-only (`ADMIN_EMAILS`), not a workspace Admin role

Verification:

- `npm test` — 20 tests, including Section DP workspace isolation (serial D1)
- `npm run check`, `npm run lint`, `npm run build`

Next: Phase 5 — Public site.

### 2026-08-20 — Phase 5

Public marketing site from spec Sections R–U, BS, DF, DL, DM.

- Homepage: hero, value props, how-it-works, FAQ. No testimonials or invented results.
- `/pricing` reads list prices from D1. ZA/INT preview toggle. Ad Credit explained. Checkout is not on this page.
- `/examples` describes the deliverable; no made-up customer commercials.
- `/acceptable-use` plus expanded privacy/terms, all marked for legal review.
- Sitemap, robots, OpenGraph metadata. Mobile menu with large tap targets.

Verification: `npm test` (29), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 6 — Dashboard.

### 2026-08-20 — Phase 6

Studio dashboard from spec Sections V–Z.

- Session + workspace required. Empty studios redirect from onboarding only when they have no membership.
- Header: **Welcome back, [First Name].** / **What would you like to create today?** / **+ Create Commercial**
- Summary cards from D1: Ad Credits (`N available`), completed commercials, in production, ready. Never invented.
- Empty copy matches spec, including **Create My First Advert** and the three steps.
- Desktop and mobile nav labels from Section Z. Profile + Sign Out in the sidebar.
- Nav destinations are honest shells with live queries (zeros, real brands/team). Create / Buy Credits are disabled with an explanation; the brief wizard is not pretended.
- VIEWER and paused studios cannot start create. Only the owner sees billing actions, still disabled until checkout exists.
- Security sessions stay under `/dashboard/settings/security`.

Verification: `npm test` (40), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 7 — Business / Brand (R2 logo upload).

### 2026-08-20 — Phase 7

Business / brand profile and private logo storage.

- `/dashboard/brand` edits the current brand. `/dashboard/brands` lists real brands and can add another. Brand switcher in studio chrome.
- Logo: SVG/PNG/WebP/JPEG, original bytes in private R2, key only in D1. Signed PUT via aws4fetch when R2 API tokens are set; otherwise Worker binding after the same workspace prefix checks.
- Upload requires a signed-in owner/admin. Object keys cannot target another workspace.
- Website import still does not invent company details.

Verification: `npm test` (47), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 8 — AI Identity.

### 2026-08-20 — Phase 8

Consent, private identity capture, and isolation from the media library.

- `/dashboard/identity` heading and copy match the spec. Consent checkboxes (including adult presenter) write `consents` with `identity-v1` before any file is accepted.
- Record Now uses MediaRecorder and does not ask for camera or microphone until that button. Upload Video and three guided photos (front / left 45° / right 45°) store original bytes in private R2.
- Keys: `workspaces/{workspaceId}/users/{userId}/identity/{front|left|right|reference-video}/{uuid}`. Identity assets are omitted from the media library. Another studio member cannot read them.
- Update Identity, Replace Video, Replace Photos, and Delete AI Identity work. Delete removes R2 objects immediately (cleanup queue still later).

Verification: `npm test` (54), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 9 — Media library.

### 2026-08-20 — Phase 9

Reusable media library with private storage. Identity files stay out.

- `/dashboard/media` tabs match the spec: Logos, Products, Business, Locations, Campaign References. Upload shows filename, preview, progress, success, and retry. Remove confirms first.
- Official brand logos appear on Logos and are changed from Brands, not deleted here. Library files use `workspaces/{workspaceId}/brands/{businessId}/assets/{role}/{uuid}`.
- CREATOR and above can add or remove library files. VIEWER can look only. Another studio cannot read these files. Complete responses have no public URL.
- Delete marks the D1 row and removes the R2 object immediately (cleanup queue still later).

Verification: `npm test` (62), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 10 — Commercial wizard.

### 2026-08-20 — Phase 10

Commercial brief wizard with autosave and resume.

- `/dashboard/create` steps: Campaign, Goal, Style, Format, References. Concept, Approve, and Produce stay closed with an explanation. Viewers still cannot start a brief.
- Drafts persist title, brand, advertising type, CTA, audience, problem, offer, avoid-saying, style, tones, platform, explicit aspect ratio, duration, and up to 6 extra photos. Leave and come back; drafts also open from Your Commercials.
- Aspect ratio is recommended from the platform but only saved when the user chooses 9:16, 16:9, or 1:1. Identity files cannot be attached.

Verification: `npm test` (67), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 11 — Creative Director.

### 2026-08-20 — Phase 11

Creative Director with industry strategies, structured concept, and immutable approval.

- `lib/ai/creative-director/` implements `generateConcept`. Mock mode never calls paid HTTP. Live mode uses OpenAI Responses structured output only when `AI_PROVIDER_MODE=live`. Missing live key returns a customer-safe error; it does not fall back to mock.
- Industry principles live in `lib/ai/ad-strategies/` (legal, real estate, restaurant, hospitality, construction, financial services, automotive, medical, home services, ecommerce, retail, software, general).
- `/dashboard/create` Concept step shows **Your Commercial Concept**: Hook, Strategy, Your Spoken Words, Scene Timeline, CTA. Buttons: Edit, New Concept, Approve & Produce. Concept generation is 0 credits. After approve, Produce stays closed with an explanation (credits and filming are later phases).
- Approve writes an immutable `creative_versions` row (`approved_at`, `approved_by`, `approved_script`). Later edits or new concepts insert a new version. Customers never see `generationPrompt`. Workspace concept generation is limited to 8 per 10 minutes.

Verification: `npm test` (74), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 12 — Prompt builder.

### 2026-08-20 — Phase 12

Filming brief builder from an approved concept. Customers never see it.

- `lib/providers/video/seedance/prompt-builder.ts` is a pure function. Identity mapping is `@Image1` front, `@Image2` left, `@Image3` right, `@Video1` presenter. Campaign photos map `@Image4`–`@Image9` from `CONTEXT_1`–`CONTEXT_6`.
- Approve now writes `seedance_prompt` from the builder, plus `approved_script` and `script_version`. Scene spoken words must appear in the approved script. The no-generated-text and background-signage instructions are always included. Aspect ratio, duration, and style are taken from the brief.
- No paid HTTP. Video submit/status remains Phase 16.

Verification: `npm test` (77), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 13 — Credits.

### 2026-08-20 — Phase 13

Ad Credit wallet, ledger, and production spend.

- `lib/credits/` decrements with `UPDATE credit_wallets SET balance = balance - 1 WHERE workspace_id = ? AND balance >= 1`. Unique `idempotency_key` on `credit_transactions` makes a double-click spend once. A technical refund uses a second unique key so it can only return once. A new production attempt (variation) uses another key and another credit.
- Zero balance blocks filming. Concept generation still costs nothing and does not spend. Approve & Produce stays closed after approval: filming is not connected yet, so we do not take a credit. If the studio has no credits, that is explained instead.
- Buying credits remains closed until Paystack (Phase 14). Grants exist for verified later payment/admin paths and tests.

Verification: `npm test` (80), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 14 — Pricing / Paystack.

### 2026-08-20 — Phase 14

Pricing catalog checkout, Paystack webhooks, subscriptions, and the billing page.

- `lib/providers/payments/` implements `createCheckout`, `verifyPayment`, `createSubscription`, `cancelSubscription`, and `handleWebhook`. `PAYMENTS_MODE=test` without a secret uses the mock adapter (no HTTP). Test keys (`sk_test_`) call Paystack's test API. Live keys are refused in test mode. `PAYMENTS_MODE=live` requires `sk_live_` and never silently mocks.
- Credits are granted only from a verified `charge.success` snapshot (amount, currency, catalog plan, workspace billing currency). Redirect `?reference=` / `?success=` is display-only. Duplicate webhook event ids and `purchase:paystack:{reference}` ledger keys cannot double-credit. Wrong amount or currency marks the payment rejected and grants nothing.
- Webhooks verify `x-paystack-signature` as HMAC-SHA512 of the **raw** body. `/dashboard/billing` shows current plan, credits, next billing date, payment method, billing history, and credit history. Owner Buy Credits / monthly start / cancel work in mock. Monthly live checkout stays closed until a Paystack plan code is stored on the catalog row. Invoices are not invented.
- Public `/pricing` remains a catalog. Paying happens in Billing after sign-in.

Verification: `npm test` (86), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 15 — Cloudflare Workflow (mock providers).

### 2026-08-20 — Phase 15

Durable production with mock filming, enhancement, and branding. No paid APIs.

- `CommercialProductionWorkflow` is exported from `worker.ts` (OpenNext custom worker) with Wrangler binding `COMMERCIAL_PRODUCTION_WORKFLOW`. Credit is reserved before the workflow is created. Duplicate in-flight starts are blocked. `next dev` has no Workflow binding, so start uses `waitUntil` and the same mock pipeline.
- Mock providers write a fixture file to private R2 (`source` / `enhanced` / `final` / thumbnail). Status page copy is Filming Your Commercial, Enhancing Your Footage, Adding Your Brand, Final Checks, Your Commercial Is Ready. Produce Commercial spends 1 Ad Credit. A technical failure refunds once. Live mode does not silently mock filming, enhancement, or branding.
- After Produce, the studio opens `/dashboard/commercials/[id]/production`. When the job is complete, the commercial page plays `/api/assets/{finalAssetId}`.

Verification: `npm test` (88), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 16 — Seedance 2.5.

### 2026-08-20 — Phase 16

Live fal.ai Seedance 2.5 adapter. Mock remains the default.

- Queue HTTP against `bytedance/seedance-2.5/reference-to-video`: submit, poll status, fetch result, download `video.url`. Locked to 480p, 30 seconds, audio on, and the brief’s explicit aspect ratio. Identity and campaign stills are passed as `image_urls` / `video_urls` (signed private GET URLs). `FAL_KEY` stays server-only.
- `AI_PROVIDER_MODE=mock` never calls fal, even with a key present. Live without a key does not silently mock. The Workflow polls with `step.sleep` instead of fal webhooks. Customers still see Filming Your Commercial.
- Adapter tests use recorded JSON fixtures. No paid HTTP in CI.

Verification: `npm test` (93), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 17 — Topaz.

### 2026-08-20 — Phase 17

Live Topaz Video API adapter. Mock remains the default.

- Create → accept → multipart PUT → complete-upload → poll status → download into private R2. Default model `prob-4` (1080p, not 4K). `TOPAZ_API_KEY` stays server-only (`X-API-Key`). Temporary Topaz download URLs are never stored for customers.
- `AI_PROVIDER_MODE=mock` never calls Topaz, even with a key present. Live without a key does not silently mock. The Workflow polls with `step.sleep` and persists multipart upload URLs across steps. Customers still see Enhancing Your Footage.
- Adapter tests use recorded JSON fixtures. No paid HTTP in CI.

Verification: `npm test` (98), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 18 — Cloudflare Container / FFmpeg.

### 2026-08-20 — Phase 18

Live media branding container. Mock remains the default.

- Worker-only media service (no public encode route) overlays the stored logo and profile fields, optional end card, 1080p H.264/AAC fast-start file, and a poster thumbnail. Width, height, duration, fps, and codecs are stored on the final file row. Logo position includes none. Empty phone/CTA/WhatsApp/website are omitted — nothing is invented.
- `AI_PROVIDER_MODE=mock` never calls the container. Live without `INTERNAL_SERVICE_SECRET` or the binding does not silently mock. Branding reads the enhanced file from private R2 and writes the finished file there. Local `next dev` / tests keep containers off so Docker is not required.
- Adapter tests use fixtures. No paid HTTP in CI.

Verification: `npm test` (104), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 19 — Customer delivery.

### 2026-08-20 — Phase 19

Customer delivery: watch, download, and start a new version without cropping a finished file.

- Production page still says you can leave. When filming is complete, Download 1080p and View my commercial both work. The commercial page plays the finished file, shows brand, date, format, duration, objective, and CTA, and downloads `cineyou-{business}-{campaign}-1080p.mp4` through the authenticated studio stream (`?download=1`). Signed URLs are not stored. Viewers can watch and download; they cannot duplicate, vary, or change format.
- Duplicate, Create Variation, and Create Vertical/Landscape Version copy the brief and reference photos into a new draft. They do not copy the finished video or an approved concept. A new aspect ratio requires a new AI production and uses 1 Ad Credit. Archive and delete are blocked while production is running. Deleted commercials are inaccessible.
- The commercials list shows a poster when a thumbnail exists.

Verification: `npm test` (108), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 20 — Notifications.

### 2026-08-20 — Phase 20

In-app notices, transactional email, and queues for side effects.

- Opening Notifications marks them read. The header badge uses the unread count. Commercial ready, production failed, credit returned, and payment receipt are written with an idempotent event key so they cannot duplicate. Ready email subject is **Your CineYou commercial is ready**; the button is **View My Commercial**. Videos are never attached.
- Welcome, verify, and reset emails use the same templates. Live send is Resend `POST https://api.resend.com/emails` with `Idempotency-Key`. Without `RESEND_API_KEY` and `EMAIL_FROM`, mail is logged as mock. Product-update preference saves; production, failure, and billing email stay on; marketing stays off.
- Production queues email on `NOTIFICATION_QUEUE` in production. Local `next dev` / tests deliver inline. A queue or email failure does not fail the production job. `CLEANUP_QUEUE` is bound for later object cleanup.

Verification: `npm test` (114), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 21 — Team / Agency.

### 2026-08-20 — Phase 21

Invitations, audited role changes, and agency groundwork without a client portal.

- Owners and admins invite by email as Admin, Creator, or Viewer. The raw token is emailed; only SHA-256 is stored. Invitations expire after 7 days. Viewers cannot invite. Accept is `/invite/accept?token=` (sign in or create an account, then join). The member is listed on Team. Role changes write `member.role_changed` to `audit_logs`. The owner role cannot be assigned or edited this way.
- Agency studios already hold multiple brands. Team and Brands copy say a separate client login is not available yet. No client portal.

Verification: `npm test` (118), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 22 — Admin.

### 2026-08-20 — Phase 22

Staff `/admin` with live aggregates and job controls. Pages use `requireAdmin` (`ADMIN_EMAILS`). APIs return 403 for non-staff.

- Overview cards count users, paying workspaces, produced commercials, active/failed jobs, ZAR/USD revenue, credits sold, stored AI cost estimates, approximate R2 bytes, and open tickets. Empty values are zero.
- Users, workspaces, commercials, jobs, payments, subscriptions, credits, pricing, prompts, AI settings, storage, support, system, and audit. Job detail can retry the last saved stage, mark technical failure, refund a credit once, and cancel. Source/final download uses a short-lived signed GET when R2 tokens exist, otherwise an authenticated staff stream. Passwords are never selected. API keys cannot be saved in D1. Cleanup only queues files already marked deleted.
- 480p / 30s / 1080p stay locked in AI settings.

Verification: `npm test` (120), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 23 — Security / Privacy.

### 2026-08-20 — Phase 23

Rate limiting, account deletion, media cleanup, impersonation reporting, and a secret-in-bundle check.

- Signup, login, password reset, website import, signed uploads, checkout, production start, and Paystack webhooks are limited in D1. Production also uses a Workers Rate Limiting binding when present (5 calls / 60s per studio). Auth uses a second binding (10 / 60s per email). Missing bindings are skipped locally.
- Account settings can export a JSON file and close the account after typing DELETE (and the current password when one exists). Sessions are revoked, identity and studio files are queued for private deletion, owned studios without other members are closed, and payment rows stay. A studio with teammates or a commercial still being produced cannot be closed from this screen.
- Uploads that go through the Worker are checked against PNG/JPEG/WebP/SVG magic bytes. Help can open a support ticket, including Abuse. `.env.example` public names are checked so secrets are not marked `NEXT_PUBLIC_`.

Verification: `npm test` (123), `npm run check`, `npm run lint`, `npm run build`.

Next: Phase 24 — Testing / Hardening.

### 2026-08-20 — Phase 24

Full DP–DX suite on isolated local D1. No skipped tests. CI-equivalent local run is green.

- `npm test` finds every `lib/**/*.test.ts` (serial). `npm run ci` is typecheck, lint, schema verify, tests, production build, then a required client-bundle secret scan.
- DX bundle scan walks `"use client"` source (not `app/api` / `actions.ts`) and, after a build, `.next/static` for known secret values. `CINEYOU_REQUIRE_BUNDLE=1` fails if `.next/static` is missing.
- Filled remaining DP–DX gaps: Topaz / branding / R2 save failures refund once without vendor names; account deletion calls mock subscription cancel, keeps payment rows, and the original email cannot sign in; closed profiles return **This account is closed.**; cleanup queue acks foreign object keys and deletes matching studio keys. Signed GET expiry and public URL keys are covered.

Verification: `npm test` (132, 0 skipped), `npm run check`, `npm run lint`, `npm run db:verify`, `npm run build`, `CINEYOU_REQUIRE_BUNDLE=1 npm run test:bundle`.

Next: Phase 25 — Cloudflare production verification.

### 2026-08-20 — Phase 25

Cloudflare Workers preview on `workerd`, mock/test modes pinned, remote storage provisioned. The Worker was not deployed and live AI/payments stay off.

- `wrangler.jsonc` `vars` set `AI_PROVIDER_MODE=mock` and `PAYMENTS_MODE=test`. Preview listens on port 8787. Observability sampling is on. `scripts/preview-smoke.ts` checks public pages, the dashboard login redirect, unauthenticated Produce Commercial (`401`), and that the auth handler rejects an unknown sign-in. Session cookie guards use Edge `middleware.ts` because OpenNext 1.20.2 cannot bundle Next.js 16 `proxy.ts`.
- Remote account resources: D1 `cineyou-production` (`a0dff7a4-9637-4b25-9941-b1b35e336e06`) with migrations and list-price seed; private R2 `cineyou-production`; queues `cineyou-notifications` and `cineyou-cleanup`. Secrets were not uploaded (`wrangler secret put` would publish a Worker version).

Verification: `npm run check`, `npm run lint`, `npm test` (134, 0 skipped), `npm run preview` + `npm run preview:smoke`.

Next: none — implementation plan complete. Production deploy and live providers wait for an explicit instruction.

### 2026-08-20 — Production deploy

Worker `cineyou` is live at **https://cineyou.schalk-966.workers.dev** with `AI_PROVIDER_MODE=mock` and `PAYMENTS_MODE=test`. `BETTER_AUTH_SECRET` is a Wrangler secret. The branding container was not built (Docker was not running); mock branding does not need it.

Verification: `GET /` 200, `GET /login` 200, `GET /dashboard` 307 to login.

### 2026-08-20 — Resend from-address (domain not verified)

`EMAIL_FROM` is `CineYou <Accounts@cineyou.co.za>` in Wrangler vars and local `.dev.vars`. The send key is in `.dev.vars` only. A Resend send to `delivered@resend.dev` returned 403: `cineyou.co.za` is not verified. The live Worker does not have `RESEND_API_KEY` yet so signup still uses mock mail. After the domain is verified at [resend.com/domains](https://resend.com/domains), upload the secret and redeploy.

### 2026-08-22 — What we could finish without other dashboards

Redeployed Worker `cineyou` (`6d7c1cf2-e5df-45dc-ac43-763f5a7b1b8e`) with the media-first public site, honest verify-email copy, `ADMIN_EMAILS=schalk@thewellmedia.com`, and `INTERNAL_SERVICE_SECRET`. Live smoke: `/` 200 with the new homepage, `/login` 200, `/admin` 307, `/verify-email` says email sending is not connected.

Still blocked without another site or local Docker: Resend domain verify, Paystack, OpenAI / filming / enhancement keys, branding container image, custom domain, counsel on legal pages. Live AI and live payments stay off.

### 2026-08-22 — Seedance live adapter is reAPI

Replaced the fal.ai filming adapter with reAPI `doubao-seedance-2.5-face`. Mock remains the default.

- Submit `POST https://reapi.ai/api/v1/videos/generations`, poll `GET /api/v1/tasks/{id}`, download `output.video_urls[0]`. Locked to 480p, 30 seconds (integer), audio on, official `size` from the brief. Identity and campaign stills stay `image_urls` / `video_urls` (signed private GET URLs). `REAPI_API_KEY` is server-only.
- `AI_PROVIDER_MODE=mock` never calls reAPI, even with a key present. Live without a key does not silently mock. Customers still see Filming Your Commercial. Adapter tests use recorded JSON fixtures. `FAL_KEY` is no longer read.
- Official reason: real-person references are allowed; 480p + uploaded video is $0.072/s (~$3.60 for a typical 30s take). BytePlus first-party rejects raw face URLs without an allowlist.

Verification: `npm run check`, `npm run lint`, `npm test` (135, 0 skipped), `npm run build`. Live AI stays off.

### 2026-08-22 — Brand is Production30

Customer-facing name, logos, email copy, legal placeholders, and download filenames now say Production30. Mail from-address is `Production30 <Accounts@production30.com>`. Cloudflare resource names (`cineyou` Worker, D1/R2/queues) stay as they are so the live Worker is not replaced.

Resend domain create via API failed: the stored key is send-only (`restricted_api_key`). Add `production30.com` in the Resend dashboard, publish the DNS records, then upload the send key. Do not upload `RESEND_API_KEY` before verify.

Verification: `npm run check`, `npm run lint`, `npm test` (135, 0 skipped), `npm run build`. Live AI stays off.

### 2026-08-22 — Resend live on production30.com

`production30.com` is verified. A Resend send from `Production30 <Accounts@production30.com>` to `delivered@resend.dev` returned 200. Worker `cineyou` version `e61edd37-248a-4c05-a7e1-4de849946474` is live with Production30 branding, that from-address, and `RESEND_API_KEY` uploaded. `AI_PROVIDER_MODE` stays `mock`. Branding container was not rebuilt (`--containers-rollout none`).

Live smoke: `/` `/login` `/signup` `/verify-email` 200 with Production30 and no “email sending is not connected”; `/admin` 307.

### 2026-08-22 — Live Commercial Concept + PayFast adapter

Commercial Concept can call OpenAI without flipping the whole pipeline live. PayFast replaces Paystack as the payment adapter. Real charges stay off.

- `CONCEPT_AI_MODE=live` uses `POST https://api.openai.com/v1/responses`. `AI_PROVIDER_MODE` stays `mock`, so filming, enhancement, and branding still do not call paid APIs. Missing `OPENAI_API_KEY` does not silently mock. Node tests force a mock director so `getPlatformProxy` cannot spend.
- Checkout / ITN: form POST to PayFast (`/eng/process`), credits only after a verified COMPLETE ITN (MD5 in posted order, `/eng/query/validate` = `VALID`, amount and ZAR checks). `return_url` is display-only. Live merchant credentials are refused while `PAYMENTS_MODE=test`. Monthly plans stay closed until recurring fields are wired. Non-ZAR plans stay closed.
- Paystack code remains unused. PayFast secrets were not uploaded.

Verification: `npm run check`, `npm run lint`, `npm test` (140, 0 skipped), `npm run build`. Worker `cineyou` version `b77d12a6-9112-4c42-a985-dc46137bff17` is live with `CONCEPT_AI_MODE=live`, `OPENAI_MODEL=gpt-5.6`, and `OPENAI_API_KEY` uploaded. `AI_PROVIDER_MODE` stays `mock`. `PAYMENTS_MODE` stays `test`. PayFast merchant secrets were not uploaded. Branding container was not rebuilt (`--containers-rollout none`).

### 2026-08-22 — Logo, blue theme, loading wheel, Artlist-style rails

Public site uses the supplied Production30 logo and a navy/blue token set. Navigation, auth, and dashboard mutations show a blue-to-purple loading wheel. Homepage / examples / how-it-works use muted looping Pexels clips as style references — labelled as such, not as customer commercials.

Verification: `npm run check`, `npm run lint`, `npm test`. Not deployed in this pass.

### 2026-08-22 — Signup confirmation 409

Resend rejected verify-email sends with `409 invalid_idempotent_request`. Better Auth tokens are JWTs; we used the first 80 characters as the idempotency key, so later signups reused a key with a different recipient. Keys now use the unique token tail. Local signup can resend from `/verify-email`.

### 2026-08-22 — New site on workers.dev

Worker `cineyou` version `1254d250-a629-40c5-a4e2-7cf74f6947a0` is live at https://cineyou.schalk-966.workers.dev with the logo, navy/blue theme, loading wheel, example clips, and the verify-email key fix. `AI_PROVIDER_MODE` stays `mock`. `PAYMENTS_MODE` stays `test`. Branding container was not rebuilt (`--containers-rollout none`). `production30.com` is not attached to the Worker yet.

### 2026-08-22 — PayFast dollar checkout

Official PayFast Custom Integration `amount` is ZAR only. USD catalog plans now convert at locked `PAYFAST_USD_ZAR_RATE` (default 18.5), charge rand, and grant the dollar-plan credits when ITN `amount_gross` matches the stored rand snapshot. Monthly plans stay closed. Not a live FX quote.

### 2026-08-22 — Media preview stream

Private file previews now read the R2 object into bytes before responding. Streaming `object.body` through OpenNext/Next could return an empty file, so the studio showed a saved upload with no picture. Remote D1 `cineyou-production` is connected (live has users and at least one stored asset). Local `npm run dev` uses a separate local D1.

Worker `cineyou` version `5c693a30-3d17-4e7c-9b40-9d1b6e31623d` is live at https://cineyou.schalk-966.workers.dev with dollar-to-rand checkout and the preview fix. `AI_PROVIDER_MODE` stays `mock`. `PAYMENTS_MODE` stays `test`. Branding container was not rebuilt.

### 2026-08-24 — Zoom-like public site

Removed the full-bleed homepage cover video. Public marketing and auth use a light layout in the Zoom style: centred headline, two buttons, then a rounded before/after comparison (same royalty-free clip, left side softened as an unfinished look). Studio/dashboard stays on the cinema dark tokens. No customer testimonials.

Verification: `npm run check`, `npm run lint`, `npm test`. Not deployed in this pass.

### 2026-08-24 — People examples + cinema public theme

Artlist / OpenArt / ImagineArt catalog clips are not free to rehost. Public examples now include Mixkit Stock Video Free License product ads with people talking on camera, plus the existing Pexels place clips, labelled as style references. Public marketing/auth uses a lifted navy (`#1A2033`) with looping video rails — darker than the Zoom white pass, not as dark as the studio `#05070F`.

Verification: `npm run check`, `npm run lint`, `npm test`. Not deployed in this pass.

### 2026-08-25 — Payoneer Checkout adapter

Payoneer Checkout replaces PayFast as the payment adapter. Real charges stay off until `PAYMENTS_MODE=live` and live Checkout merchant credentials are set.

- Checkout: authenticated `POST /api/lists` on `api.{sandbox|live}.oscato.com`, then redirect to the v3 hosted payment page. Credits only after `GET /api/charges/{longId}` returns `status.code=charged`, with amount, currency, and plan checks. Browser return URL is display-only. Live merchant credentials are refused while `PAYMENTS_MODE=test`. Monthly plans stay closed. ZAR and USD catalog amounts are charged in that currency (no locked rand conversion).
- A personal Payoneer balance cannot run Checkout. Merchant code + payment token from Payoneer Checkout onboarding must be set as `PAYONEER_USERNAME` / `PAYONEER_TOKEN` (never `NEXT_PUBLIC_*`). Secrets were not uploaded. PayFast and Paystack code remains unused.

Verification: `npm run check`, `npm run lint`, `npm test`. Not deployed. `PAYMENTS_MODE` stays `test`.

### 2026-08-25 — Customer ops (support, refunds, cancel, email)

Closed the support loop without live chat. Help tickets email `ADMIN_EMAILS` and the customer. Admin Support shows customer, email, studio, full message, and the thread. Staff replies email the customer. Categories include Refund and Cancel plan. Public `/contact` writes the same tickets for people who are not signed in.

Money returns are recorded on a confirmed payment after staff refunds in Payoneer Checkout — no invented refund API, no extra Ad Credits. Billing cancel for Payoneer/PayFast points to Help. Staff can mark `cancelAtPeriodEnd` after they stop the plan in Payoneer. Help articles explain when an Ad Credit comes back vs when money comes back.

Verification: `npm run check`, `npm run lint`, `npm test`, `npm run db:verify`. Remote D1 `0006_support_ops` applied. Worker `cineyou` version `743376d1-85a8-4db4-90e1-201e7828a012` is live at https://cineyou.schalk-966.workers.dev with Contact, ticket mail, and Admin reply. `AI_PROVIDER_MODE` stays `mock`. `PAYMENTS_MODE` stays `test`. Branding container was not rebuilt (`--containers-rollout none`). `production30.com` is not attached (registrar NS `tld-ns.com`, not a Cloudflare zone).

### 2026-08-28 — Rapyd Collect adapter

Rapyd Collect replaces Payoneer Checkout as the payment adapter. Sandbox checkout is on when `PAYMENTS_MODE=test`, `RAPYD_MODE=sandbox`, and both keys are set. Live Rapyd charges stay off until `PAYMENTS_MODE=live` and `RAPYD_MODE=live`.

- Checkout: signed `POST /v1/checkout` on `sandboxapi.rapyd.net`, then redirect to the hosted Rapyd page. Credits only after signed `GET /v1/payments/{id}` returns `status=CLO` and `paid=true`, with amount, currency, and plan checks. Browser return URL is display-only. Live Rapyd credentials are refused while `PAYMENTS_MODE=test`. Monthly plans stay closed. ZAR and USD catalog amounts are charged in that currency.
- Access key and secret key are `.dev.vars` / Wrangler secrets (never `NEXT_PUBLIC_*`, never committed). Webhook URL in the Rapyd Client Portal must be the exact public URL (`/api/webhooks/rapyd`). Payoneer, PayFast, and Paystack code remains unused. Worker secrets were not uploaded in this pass.

Verification: `npm run check`, `npm run lint`, Rapyd/billing/security tests. Not deployed. `PAYMENTS_MODE` stays `test`. Worker secrets were not uploaded.

### 2026-08-28 — Seedance 2.5 via reAPI stays the filming path

Evaluated the Seedance 2 Generator playground (MuAPI 2.0, Postgres, Stripe). It is not merged. Filming stays `doubao-seedance-2.5-face` on reAPI. No adapter or UI change.

### 2026-08-28 — Live on production30.thewellmedia.com

Git push does not update this host. Worker `cineyou` version `998d5d89-c0c7-488d-910f-62cd687c830d` is deployed with Wrangler custom domain `production30.thewellmedia.com` and `workers_dev` kept on. Auth vars point at that host. `AI_PROVIDER_MODE` stays `mock`. `PAYMENTS_MODE` stays `test`. Branding container was not rebuilt (`--containers-rollout none`). Live smoke: `/` 200 with the sales homepage (no `/_next/image`), `/login` `/how-it-works` `/pricing` `/examples` 200.

### 2026-08-28 — Ad Studio (business advert first, viral videos second)

`/dashboard/create` is now an Ad Studio hub instead of auto-opening the latest draft. Business advert is first: Website to advert (URL + format, published title/description only), Motion design, then looks (TVC, Cinematic, Corporate, Environments, Motion Studio, Creative Studio). Viral videos is second: Recreate a viral advert (stills + optional original URL), Lifestyle UGC, then looks (Lifestyle UGC, High energy, Funny). Each path creates a normal draft and continues the existing brief → concept → produce pipeline. No second video engine, no generated avatars, no fake instant video from a URL. Nav label is **Ad Studio**; overview CTA is **+ Create Advert**.

Verification: `npm run check`, `npm run lint`, importer/studio tests. Not deployed.

### 2026-08-28 — Sales homepage from supplied media pack

Rebuilt `/` to the supplied sales mockup. Assets live in `public/production30-homepage/` (39 files). Business Sales Advert is first; Viral Growth Video is second. Wyzowl 2026 industry figures stay attributed and are not Production30 results. Button labels on `#2787FF` stay `#001038` (white on that blue fails AA). Existing logo, login, signup, pricing, and produce pipeline are unchanged.

### 2026-08-28 — Public pages match the sales homepage

How it works, Examples, Plans, Contact, legal, and auth now use the same navy sales theme, header, and closing CTA. Promo banner is off on public pages. Signup copy changes when `intent=advert` or `intent=viral`. Dashboard overview empty state and summary cards were tightened. Admin is unchanged. No fake testimonials or invented prices.

Verification: `npm run check`, `npm run lint`, homepage/contrast tests. Not deployed.

### 2026-08-28 — Video stills were waiting on the MP4

Public `<video>` tags had no poster. The homepage phones used `preload="auto"` on both clips (2.4 MB + 9.2 MB). Example cards used `preload="metadata"` on 1–11 MB files, and `hero.mp4` had its index at the end so the browser had to read most of the file before a first frame. Stills now use the existing hero webps and JPEG first frames (`/examples/posters/`). The second phone does not preload until it plays. `hero.mp4` was remuxed with `+faststart`.

### 2026-08-28 — Signup confirmation mail and empty user table

Signing up with an email that already had a verified account returned a generic success and then asked for the email again, with no message sent. All customer rows were removed from remote D1 `cineyou-production` (plans kept). Signup now goes to a Thank you screen that names the inbox and does not show a second email field. Confirmation mail is sent on signup (and again if they try to sign in before confirming). Welcome mail waits until the address is confirmed. Signing up again with a confirmed address sends a sign-in reminder instead of silence.

Verification: `npm run check`, auth/email tests. Worker `cineyou` version `c4f82786-97d8-4618-bccd-58dcb186f63e` with `--containers-rollout none`. Live `/verify-email?email=` shows Thank you and does not ask for the email again.

### 2026-08-30 — Rapyd sandbox Buy Credits never reached Collect

Live Worker `cineyou` had `RAPYD_MODE=sandbox` but no `RAPYD_ACCESS_KEY` / `RAPYD_SECRET_KEY`. That fell through to the mock adapter, so Buy Credits looked open, redirected home, and sat on “We're confirming your payment…” — credits only grant after a signed webhook plus `GET /v1/payments/{id}` with `CLO` and `paid`. Mock never calls Rapyd.

Local sandbox keys authenticate (`GET /v1/data/countries` SUCCESS) but `POST /v1/checkout` returns official `ROUTE_PERMISSION_ERROR` for both ZA/ZAR and US/USD. Collect hosted checkout is not enabled on this Rapyd sandbox account. `RAPYD_MODE=sandbox` without keys now closes Buy Credits instead of mocking. Failed checkout shows “Card checkout is not enabled on this payment account yet” and logs `[production30:payments]` status/`error_code` only. `RAPYD_WEBHOOK_URL` var is `https://production30.thewellmedia.com/api/webhooks/rapyd`. Keys uploaded as Worker secrets. Owner must enable Collect in the Rapyd Client Portal and set that same webhook URL there.

Verification: `npm run check`, Rapyd/billing tests. Worker `cineyou` version `5167beab-3ff1-4be0-a572-c81cfc757b04` with `--containers-rollout none`. `PAYMENTS_MODE` stays `test`. `AI_PROVIDER_MODE` stays `mock`. Pre-existing lint on `hero-phone-sequence.tsx` was not part of this change.

### 2026-08-30 — reAPI key on Worker cineyou

`REAPI_API_KEY` uploaded as a Worker secret from local `.dev.vars`. `AI_PROVIDER_MODE` stays `mock`, so Produce Commercial still does not call reAPI.

### 2026-08-30 — Filming Your Commercial is live (reAPI)

Owner asked to switch filming on. `FILMING_AI_MODE=live` calls reAPI `doubao-seedance-2.5-face` when `REAPI_API_KEY` is set. `AI_PROVIDER_MODE` stays `mock`, so Enhancing Your Footage and Adding Your Brand do not call Topaz or the branding container. Mock enhancement now keeps the filmed file instead of swapping in the development fixture. Missing `REAPI_API_KEY` still fails with “Live filming is not connected yet.” and does not silently mock.

Verification: `npm run check`, filming/upscale/production tests. Worker `cineyou` version `bd4dcd99-9385-4633-8248-aae3e1757107` with `--containers-rollout none`. `PAYMENTS_MODE` stays `test`.

### 2026-08-30 — Studio is live on cineyou 444c56b4

GitHub Deploy Worker failed on `wrangler deploy` after OpenNext succeeded: leftover `.open-next/cloudflare/next-env.mjs` had duplicate `production` / `development` / `test` exports from the recursive build. A clean `npx opennextjs-cloudflare build` then `npm run cf:deploy` from this laptop uploaded Worker `cineyou` version `444c56b4-7592-4cb3-8cc8-e8252b268cd2` to https://production30.thewellmedia.com. Branding container was not rebuilt (`--containers-rollout none`).

### 2026-08-30 — OpenNext was calling itself

`npm run build` had been set to `opennextjs-cloudflare build`. OpenNext then runs `npm run build` to compile Next.js, so the process nested until GitHub cancelled it (~3.5 minutes) and a local run filled the disk (`ENOSPC`). `build` is `next build` again. OpenNext is `npm run cf:build` / `npm run deploy`. The Action runs `npx opennextjs-cloudflare build` then `npm run cf:deploy`.

### 2026-08-30 — GitHub Deploy Worker died mid-OpenNext build

`CLOUDFLARE_API_TOKEN` is now present. Attempt 2 of run `33320891101` passed the token check and `npm ci`, then `npm run build` was killed with exit 143 (SIGTERM) after ~3.5 minutes. That is the 7 GB GitHub runner running out of memory, not a compile error we could read from public logs. Run 8 got swap on `/mnt/opennext.swap`, then OpenNext was cancelled after ~3 minutes (`The operation was canceled.`). A 6 GB Node heap on the 7 GB runner likely evicted the job. Heap is now 4 GB and Node is pinned to 24.

### 2026-08-30 — Reference video upload rejected generated user ids

Better Auth `user.id` on live D1 is a 32-character token with no dashes. Identity object keys required UUID-shaped workspace, user, and object ids, so Record/Upload Reference video failed with an internal “generated ids” error. Entity ids (workspace, user, brand, commercial) now accept UUIDs or 16–128 character tokens without dots or slashes. Object ids stay UUIDs so filenames cannot become keys. Customer-facing copy is “We could not save that file. Try again.”

### 2026-08-30 — Simple studio: Overview, Create Advert, My Adverts, Reference Profile

Desktop nav is only Overview, Create Advert, My Adverts, Reference Profile, Buy Credits, Billing, Settings, Help. Mobile is Home, Create, Adverts, Credits, Settings. Brands, Media Library, Notifications, and Team stay at their old URLs but are off the nav.

Create Advert is a four-step path: choose a saved Reference Profile or upload selfie video, face photos, logo, and extra photos; write one script prompt with the existing type/style/platform/shape/CTA suggestions; approve the script; generate the video. A progress bar stays on the generate step and on the production page (Filming Your Commercial → Enhancing Your Footage → Adding Your Brand). `/dashboard/identity` redirects to `/dashboard/profile`.

### 2026-08-30 — Workers Builds must OpenNext-build

`npm run cf:build` is `opennextjs-cloudflare build`. `npm run build` stays `next build` because OpenNext invokes that. `npm run cf:deploy` is `wrangler deploy --containers-rollout none`. GitHub Action uses `npx opennextjs-cloudflare build` then `npm run cf:deploy`.

### 2026-08-25 — Legal pages (working copy)

Replaced placeholder `/terms`, `/privacy`, and `/acceptable-use` with original Production30 copy in the same sectioned style as typical creative platforms (accounts, credits, inputs/outputs, impersonation, processors, disclaimers). Specific to this product: 30-second commercial starring you, 1 Ad Credit = 1 production, identity photos + reference video, private storage, Ad Credit back vs money back via Help, no public face gallery. Banner still reads **Requires professional legal review before launch.** Not attorney-reviewed. Signup Terms checkbox now includes Acceptable use. Not deployed.


