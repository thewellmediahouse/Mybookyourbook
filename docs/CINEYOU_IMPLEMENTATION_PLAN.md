# Production30 implementation plan

Phased build order from `CINEYOU_MASTER_SPEC.md` Section EA. After **each** phase: TypeScript, lint, relevant tests, build/preview where applicable, fix errors, update `CINEYOU_PROGRESS.md`, record API decisions in `CINEYOU_API_NOTES.md`.

A phase is not complete because UI exists. Frontend, backend, authorization, validation, persistence, errors, and required tests must all land.

---

## Phase 1 — Repository / Foundation

**Objective:** Replace the Astro template with Next.js App Router on Cloudflare Workers (OpenNext). App runs locally and Cloudflare preview builds. Cinema design tokens and replaceable brand SVGs.

**Dependencies:** None. This phase deletes Astro/Shopify/template code.

**Files / modules:** `package.json`, `next.config.ts`, `open-next.config.ts`, `wrangler.jsonc`, `app/`, `app/globals.css`, `components/ui/`, `public/brand/*.svg`, `.env.example`, `.gitignore`, `.cursor/rules/cineyou.mdc`, README.

**Database:** Bindings declared (`DB`). No migrations yet.

**External services:** Cloudflare Workers / OpenNext only. No live D1/R2 creation required to preview.

**Security:** No secrets in `NEXT_PUBLIC_*`. `.dev.vars` gitignored.

**Tests:** Typecheck, lint, `next build`, `npm run preview`.

**Completion:** `next dev` works; OpenNext preview serves the hero landing shell; tokens pass contrast rules.

---

## Phase 2 — D1 / Drizzle

**Objective:** D1-compatible Drizzle schema and migrations for all tables in spec Sections CG–CN. Seed plans/pricing. Dev seed data that is obviously fake-labelled if used.

**Dependencies:** Phase 1.

**Files / modules:** `drizzle.config.ts`, `lib/db/schema/*.ts`, `lib/db/client.ts`, `drizzle/` migrations, seed script.

**Database:** Better Auth tables, profiles, workspaces, members, invitations, businesses, brand_assets, presenter_identities, identity_assets, assets, projects, project_references, creative_versions, production_jobs, production_events, generation_attempts, credit_wallets, credit_transactions, plans, subscriptions, payments, payment_events, notifications, support_tickets, consents, audit_logs, app_settings, prompt_framework_versions.

**External services:** Local D1 via Wrangler.

**Security:** No blobs in D1. No signed URLs stored. SQLite types only.

**Tests:** Migration applies cleanly; seed runs; schema types generate.

**Completion:** `wrangler d1 migrations apply` (local) succeeds.

---

## Phase 3 — Better Auth

**Objective:** Signup, login, logout, email verification, password reset, conditional Google OAuth, sessions, auth guards. Do not hand-roll passwords.

**Dependencies:** Phase 2. Consult Better Auth D1/Drizzle docs; expected `transaction: false` for D1.

**Files / modules:** `lib/auth/`, `app/api/auth/[...all]/route.ts`, signup/login/verify/forgot/reset pages, email provider stub (Resend interface; mock in mock/test).

**Database:** Better Auth tables + profiles (first/last name).

**External services:** Better Auth; Resend when configured; Google OAuth only if both client env vars set.

**Security:** Email normalize, strong password, terms + privacy checkboxes, no broken Google button if unset.

**Tests:** Anonymous blocked from dashboard; session cookie set; reset token flow.

**Completion:** Full email/password auth works in mock email mode.

---

## Phase 4 — Workspaces / Roles

**Objective:** Workspaces, memberships, roles, centralized `require*` helpers, brand/workspace switcher data.

**Dependencies:** Phase 3.

**Files / modules:** `lib/authz/`, workspace create-on-onboarding, member queries.

**Database:** workspaces, workspace_members.

**External services:** None.

**Security:** Server-side only. VIEWER cannot produce. CREATOR cannot change billing. Cross-workspace reads fail.

**Tests:** Isolation tests in spec Section DP (workspace portion).

**Completion:** Isolation tests pass.

---

## Phase 5 — Public site

**Objective:** Homepage (full spec copy), pricing, how-it-works, examples, auth pages, privacy/terms/acceptable-use placeholders, responsive layout.

**Dependencies:** Phase 1 (can overlap Phase 3 pages). Legal pages marked **Requires professional legal review before launch.**

**Files / modules:** `app/page.tsx`, `app/pricing`, `app/how-it-works`, `app/examples`, legal routes, marketing components.

**Database:** Pricing reads from `plans` once Phase 2 exists; until then static from seed only after Phase 2.

**External services:** None.

**Security:** No fake testimonials or revenue.

**Tests:** Pages render; SEO metadata; sitemap/robots.

**Completion:** Public routes from spec Section U exist and are responsive.

---

## Phase 6 — Dashboard

**Objective:** Overview, nav (desktop + mobile), empty states, recent commercials (real zeros), profile/notifications shell.

**Dependencies:** Phases 3–4.

**Files / modules:** `app/dashboard/`, dashboard layout, nav, empty state copy from spec.

**Database:** Counts from real queries.

**External services:** None.

**Security:** Dashboard requires session + workspace.

**Tests:** Unauthenticated redirect.

**Completion:** Empty dashboard copy matches spec; no fabricated stats.

---

## Phase 7 — Business / Brand

**Objective:** Onboarding (account → business → brand → AI identity skippable → ready), business profile, brand profile, logo upload to R2, multiple brands.

**Dependencies:** Phase 4. R2 signed uploads.

**Files / modules:** `app/onboarding/`, `app/dashboard/brand`, `lib/r2/`, website importer interface (review/edit/approve; never silent hallucinated save).

**Database:** businesses, brand_assets.

**External services:** R2; optional fetch for website import behind abstraction.

**Security:** Signed PUT; MIME allowlist PNG/WebP/JPEG only; workspace-scoped keys.

**Tests:** Upload requires auth; cannot write another workspace prefix.

**Completion:** Logo round-trip via signed URL; brand switcher lists real brands.

---

## Phase 8 — AI Identity

**Objective:** Consent, 8–15s reference video (MediaRecorder or upload), three guided photos, private R2, identity page, replace/delete.

**Dependencies:** Phase 7.

**Files / modules:** `app/dashboard/identity`, consent checkboxes + `consents` rows, capture UI.

**Database:** presenter_identities, identity_assets, consents.

**External services:** R2.

**Security:** Camera permission only after Record; adult presenter MVP; identity not in media library; mapping Image1 front / Image2 left / Image3 right / Video1.

**Tests:** Consent required; unrelated user cannot read identity keys.

**Completion:** Identity assets private; delete schedules cleanup.

---

## Phase 9 — Media library

**Objective:** Reusable logos/products/business/locations/campaign references. Signed access. Not identity assets.

**Dependencies:** Phase 7.

**Files / modules:** `app/dashboard/media`, assets table usage.

**Database:** assets.

**External services:** R2.

**Security:** Same signed URL rules.

**Tests:** Spec Section DQ remainder.

**Completion:** Upload/list/remove with previews and progress.

---

## Phase 10 — Commercial wizard

**Objective:** `/dashboard/create` steps: campaign, goal, style, format, references; autosave; resume.

**Dependencies:** Phases 6–9.

**Files / modules:** wizard routes/components, project draft persistence.

**Database:** projects, project_references.

**External services:** None.

**Security:** CREATOR+; VIEWER blocked.

**Tests:** Autosave; leave and resume; explicit aspect ratio required.

**Completion:** Draft projects persist all brief fields.

---

## Phase 11 — Creative Director

**Objective:** OpenAI provider abstraction, industry strategy library, Zod structured concept, regenerate (0 credits), approve.

**Dependencies:** Phase 10.

**Files / modules:** `lib/ai/creative-director/`, `lib/ai/ad-strategies/*.ts`, concept UI.

**Database:** creative_versions (draft until approve).

**External services:** OpenAI in live mode; mock JSON in mock mode.

**Security:** Rate limit concept generation. Never show raw prompts to customers.

**Tests:** Invalid structured output retries; mock returns valid Zod.

**Completion:** Approve creates immutable creative version.

---

## Phase 12 — Prompt builder

**Objective:** Seedance prompt from approved concept; identity mapping; locked dialogue; anti-generated-text rule; tests.

**Dependencies:** Phase 11.

**Files / modules:** `lib/providers/video/seedance/prompt-builder.ts`.

**Database:** `seedance_prompt` on creative_versions; draft vs approved script fields.

**External services:** None (pure function).

**Security:** Prompt never shown to customers.

**Tests:** Spec Section DU (mapping, dialogue lock, no-text instruction always present).

**Completion:** Unit tests pass.

---

## Phase 13 — Credits

**Objective:** Wallets, ledger, idempotent generation spend, conditional D1 decrement, technical refunds once.

**Dependencies:** Phase 2, 4.

**Files / modules:** `lib/credits/`.

**Database:** credit_wallets, credit_transactions.

**External services:** None.

**Security:** No read-then-write race. Unique idempotency_key.

**Tests:** Spec Section DR.

**Completion:** Double-click spends once; zero balance blocks production.

---

## Phase 14 — Pricing / Paystack

**Objective:** Plan data (ZA + international), checkout, webhook, billing page, subscriptions. Test mode first.

**Dependencies:** Phase 13.

**Files / modules:** `lib/providers/payments/`, `app/pricing`, `app/dashboard/billing`, `app/api/webhooks/paystack`.

**Database:** plans, subscriptions, payments, payment_events.

**External services:** Paystack test API.

**Security:** Never trust redirect params. Verify signature. Idempotent webhooks. Wrong amount/currency rejected.

**Tests:** Spec Section DS.

**Completion:** Verified webhook grants the correct package once.

---

## Phase 15 — Cloudflare Workflow (mock providers)

**Objective:** `CommercialProductionWorkflow` durable steps with mock Seedance/Topaz/branding. Full path to COMPLETE with fixture video.

**Dependencies:** Phases 12–14. OpenNext Worker export wrapper.

**Files / modules:** `lib/workflows/commercial-production.ts`, Worker re-export, production start API, status mapping.

**Database:** production_jobs, production_events, generation_attempts.

**External services:** Cloudflare Workflows. Mock providers only.

**Security:** Credit reserved before workflow create. Duplicate start prevented.

**Tests:** Spec Section DT success path with mocks.

**Completion:** Produce → status page → fixture ready. No paid APIs.

---

## Phase 16 — Seedance 2.5

**Objective:** Real fal.ai adapter: 480p, 30s, audio, explicit aspect ratio, image_urls/video_urls per current docs, async, save 480p to R2.

**Dependencies:** Phase 15. Consult fal.ai docs; log in API notes.

**Files / modules:** `lib/providers/video/seedance/`.

**Database:** provider job ids on production_jobs.

**External services:** fal.ai live only if `AI_PROVIDER_MODE=live`.

**Security:** `REAPI_API_KEY` server-only. Poll tasks; no webhooks.

**Tests:** Adapter unit tests against recorded fixtures; mock still default.

**Completion:** Live adapter implemented; mock remains default.

---

## Phase 17 — Topaz

**Objective:** create / accept / upload (multipart) / process / poll / retrieve / copy 1080p to R2. Default model `prob-4`.

**Dependencies:** Phase 16. Consult current Topaz Video API.

**Files / modules:** `lib/providers/upscale/topaz/`.

**Database:** upscale provider ids.

**External services:** Topaz live only in live mode.

**Security:** Never deliver temporary Topaz URLs to customers.

**Tests:** Spec Section DV with mocks.

**Completion:** Mock + live adapter; 1080p in R2.

---

## Phase 18 — Cloudflare Container / FFmpeg

**Objective:** Inspect media; overlay exact logo/CTA/phone/WhatsApp/website; optional end card; thumbnail; H.264/AAC/1080p fast-start MP4.

**Dependencies:** Phase 17. Container binding + Dockerfile. No public FFmpeg endpoint.

**Files / modules:** `lib/containers/`, Dockerfile, branding options from business profile.

**Database:** final asset metadata (width, height, duration, codecs, size, key).

**External services:** Cloudflare Containers.

**Security:** Internal service secret. Authenticated Worker → container only.

**Tests:** Branding uses structured profile fields; no invented text.

**Completion:** Final MP4 + thumbnail in R2.

---

## Phase 19 — Customer delivery

**Objective:** Production timeline page, commercial detail, signed stream/download, variation/duplicate/format version (new production = 1 credit; no fake crop-as-equal).

**Dependencies:** Phase 18.

**Files / modules:** `app/dashboard/commercials/[id]`, production page, status copy map.

**Database:** project status, final_asset_id.

**External services:** R2 signed GET.

**Security:** Project access required.

**Tests:** Download filename `cineyou-{business}-{campaign}-1080p.mp4`.

**Completion:** Customer can leave production page and later download.

---

## Phase 20 — Notifications

**Objective:** In-app notifications, transactional email (welcome, verify, reset, ready, failure, receipt, invite), queues for side effects.

**Dependencies:** Phase 15+.

**Files / modules:** notifications table, `lib/providers/email/`, queue consumers.

**Database:** notifications.

**External services:** Resend; Queues. Never attach giant videos.

**Security:** No duplicate critical emails (idempotent events).

**Tests:** Completion and failure notices; queue failure does not fail production job.

**Completion:** Header badge + email in mock (logged) and live (Resend).

---

## Phase 21 — Team / Agency

**Objective:** Invitations, role changes (audit logged), agency groundwork (multiple brands, no client portal yet).

**Dependencies:** Phase 4.

**Files / modules:** `app/dashboard/team`, invite accept flow.

**Database:** workspace_invitations.

**External services:** Email invite.

**Security:** Invites expire. OWNER/ADMIN only.

**Tests:** Role change logged; VIEWER cannot invite.

**Completion:** Invite → accept → member listed.

---

## Phase 22 — Admin

**Objective:** `/admin` overview (real aggregates), users, workspaces, jobs, failed jobs, payments, subscriptions, credits, pricing, prompts, AI settings (non-secret), storage, support, audit.

**Dependencies:** Most prior phases.

**Files / modules:** `app/admin/**`.

**Database:** Reads + admin mutations with audit_logs.

**External services:** Signed admin downloads of source/final.

**Security:** `requireAdmin`. Never view passwords. Never store API keys in D1 settings. No unrestricted bucket wipe.

**Tests:** Non-admin 403.

**Completion:** Job detail can retry stage, mark technical failure, refund once, cancel.

---

## Phase 23 — Security / Privacy

**Objective:** Rate limiting, webhook verification, account deletion workflow, media cleanup, impersonation safety, consent, secret-in-bundle check.

**Dependencies:** Phases 3, 8, 14, 15.

**Files / modules:** rate limit middleware, deletion workflow, cleanup queue.

**Database:** Retain legally required payment records.

**External services:** R2 lifecycle / cleanup jobs.

**Security:** Spec Sections DC–DE, DW, DX.

**Tests:** Account deletion + security suites.

**Completion:** Checklist in spec EG Security.

---

## Phase 24 — Testing / Hardening

**Objective:** Full unit + integration suites. Fix failures. No skipped critical tests.

**Dependencies:** All feature phases intended for MVP.

**Files / modules:** `tests/` or co-located `*.test.ts`.

**Database:** Isolated D1 test DB.

**External services:** Mocks.

**Security:** Bundle scan for secrets.

**Tests:** Spec DP–DX.

**Completion:** CI-equivalent local run green.

---

## Phase 25 — Cloudflare production verification

**Objective:** `npm run preview` then production build. Workers runtime compatibility. Do not enable live AI/payments without explicit instruction.

**Dependencies:** Phase 24.

**Files / modules:** wrangler production env, secrets via Wrangler.

**Database:** Production D1/R2 provisioned.

**External services:** Cloudflare account.

**Security:** Secrets in Wrangler; `AI_PROVIDER_MODE` and `PAYMENTS_MODE` explicit.

**Tests:** Preview smoke of auth + mock produce if enabled.

**Completion:** Spec EG Testing + Deployment items.

---

## Context recovery

If a session starts mid-build, read the five `docs/CINEYOU_*.md` files and continue from the first unfinished phase in `CINEYOU_PROGRESS.md`. Do not restart Phase 1.
