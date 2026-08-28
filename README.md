# Production30

**Your business, starring you.**

Production30 is an automated advertising-production platform. Customers brief their business, show who they are, approve a commercial concept, and receive a polished 1080p advert. They never configure AI models, prompts, or infrastructure.

This repository previously held an Astro marketing template. It is now the Production30 SaaS codebase.

Canonical product docs:

- [`docs/CINEYOU_MASTER_SPEC.md`](docs/CINEYOU_MASTER_SPEC.md)
- [`docs/CINEYOU_IMPLEMENTATION_PLAN.md`](docs/CINEYOU_IMPLEMENTATION_PLAN.md)
- [`docs/CINEYOU_PROGRESS.md`](docs/CINEYOU_PROGRESS.md)
- [`docs/CINEYOU_ARCHITECTURE.md`](docs/CINEYOU_ARCHITECTURE.md)
- [`docs/CINEYOU_API_NOTES.md`](docs/CINEYOU_API_NOTES.md)

## Technology stack

| Layer | Choice |
| --- | --- |
| App | Next.js App Router, React, TypeScript strict |
| UI | Tailwind CSS v4, shadcn/ui |
| Hosting | Cloudflare Workers via `@opennextjs/cloudflare` |
| Database | Cloudflare D1 + Drizzle |
| Auth | Better Auth 1.7 (D1 / Drizzle, `transaction: false`) |
| Media | Private Cloudflare R2 |
| Jobs | Cloudflare Workflows |
| Branding encode | Cloudflare Containers + FFmpeg |
| Video generation | Seedance 2.5 via reAPI (480p source) |
| Enhancement | Topaz Labs Video API (1080p) |
| Payments | Rapyd Collect first (ZAR and USD, sandbox while `PAYMENTS_MODE=test`). Payoneer, PayFast, and Paystack adapters remain unused. |
| Email | Resend |

Do not use Supabase or PostgreSQL-specific SQL. Do not store videos in D1.

## Local setup

Requirements: Node 24 (see `.nvmrc`), npm 10.9.x-compatible lockfile.

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
# Put a long random BETTER_AUTH_SECRET in both .env and .dev.vars
npm install
npm run db:migrate:local
npm run db:seed:local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.dev.vars` is already present for OpenNext local bindings (`NEXTJS_ENV=development`). Secrets go in `.dev.vars` and `.env` — never commit them.

## Mock mode

```env
AI_PROVIDER_MODE=mock
CONCEPT_AI_MODE=live
PAYMENTS_MODE=test
```

`AI_PROVIDER_MODE=mock` is pinned in `wrangler.jsonc` and must never call paid filming, enhancement, or branding APIs. Commercial Concept may be independently live via `CONCEPT_AI_MODE=live` and `OPENAI_API_KEY`. Missing that key must not silently mock. `PAYMENTS_MODE=test` stays on until live PayFast charges are explicitly approved.

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js local dev (Node). Bindings via `initOpenNextCloudflareForDev`. |
| `npm run check` | TypeScript (`tsc --noEmit`) |
| `npm run lint` | ESLint |
| `npm run build` | Next.js production build |
| `npm run preview` | OpenNext build + Cloudflare Workers preview runtime (`http://127.0.0.1:8787`) |
| `npm run preview:smoke` | Hit public pages, login redirect, and unauthenticated produce against a running preview |
| `npm run deploy` | OpenNext build + deploy Worker `cineyou` (skips branding container rebuild) |
| `npm run cf-typegen` | Generate `cloudflare-env.d.ts` from Wrangler bindings |
| `npm run db:generate` | Generate SQL from Drizzle schema |
| `npm run db:migrate:local` | Apply migrations to local D1 |
| `npm run db:migrate:remote` | Apply migrations to the remote `cineyou-production` D1 |
| `npm run db:seed:local` | Seed ZA/INT list prices (idempotent) |
| `npm run db:seed:remote` | Seed list prices on the remote D1 |
| `npm run db:verify` | Assert all spec tables are exported |
| `npm test` | Auth, workspace isolation, pipeline, billing, and security tests (serial local D1) |
| `npm run test:bundle` | Scan client source and, after a build, `.next/static` for leaked secrets |
| `npm run ci` | Typecheck, lint, schema verify, tests, production build, bundle scan |

## Database / migrations

Schema: [`lib/db/schema/`](lib/db/schema/). SQL: [`drizzle/`](drizzle/). Client: [`lib/db/client.ts`](lib/db/client.ts) (`createDb` / `getDb` via OpenNext `getCloudflareContext`).

```bash
npm run db:generate
npm run db:migrate:local
npm run db:seed:local
```

Local D1 lives under `.wrangler/` (gitignored). Remote D1 `cineyou-production` (`a0dff7a4-9637-4b25-9941-b1b35e336e06`) is provisioned; apply with `npm run db:migrate:remote` after new SQL.

Do not store video blobs or signed URLs in D1. SQLite types only.

## Cloudflare

Worker name: `cineyou`. Live host: **https://production30.thewellmedia.com** (also `https://cineyou.schalk-966.workers.dev`). Config: [`wrangler.jsonc`](wrangler.jsonc). Local Workers preview listens on port **8787** so it does not collide with `next dev` on 3000.

**Git push does not update that host by itself.** `.open-next/` is gitignored. A push must run OpenNext, then deploy Worker `cineyou` — not a Cloudflare Pages project and not a bare `wrangler deploy`.

- **GitHub Actions (in this repo):** [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) on `main`. Add repository secret **`CLOUDFLARE_API_TOKEN`** (Cloudflare dashboard → Manage Account → API Tokens → Create Token → **Edit Cloudflare Workers**). Account ID is already in the workflow. Official: [GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/). A missing token is why **Deploy Worker** fails in about a minute.
- **Workers Builds (dashboard):** Worker `cineyou` → Settings → Builds. Build command `npx opennextjs-cloudflare build`. Deploy command `npx opennextjs-cloudflare deploy -- --containers-rollout none`. Add build vars `NEXT_PUBLIC_APP_URL=https://production30.thewellmedia.com` and `NEXT_PUBLIC_APP_NAME=Production30`. Official: [OpenNext Workers Builds](https://opennext.js.org/cloudflare/howtos/dev-deploy). Use **either** Actions **or** Workers Builds, not both.
- Do not Git-connect this repo as **Pages**. That is the old Astro preview path and will not deploy OpenNext.

Bindings:

- `DB` → D1 `cineyou-production`
- `MEDIA_BUCKET` → private R2 `cineyou-production`
- `NOTIFICATION_QUEUE` / `CLEANUP_QUEUE` → `cineyou-notifications` / `cineyou-cleanup`
- `ASSETS`, `WORKER_SELF_REFERENCE` (OpenNext)
- `COMMERCIAL_PRODUCTION_WORKFLOW` / `MediaProcessingService` exported from `worker.ts`
- `AUTH_RATE_LIMIT`, `PRODUCTION_RATE_LIMIT`

Plain vars in Wrangler (not secrets): `AI_PROVIDER_MODE=mock`, `CONCEPT_AI_MODE=live`, `OPENAI_MODEL`, `PAYMENTS_MODE=test`, `RAPYD_MODE=sandbox`.

Secrets stay out of git. For a future deploy, set them with Wrangler **after** you explicitly decide to ship — `wrangler secret put` publishes a new Worker version:

```bash
npx wrangler secret put BETTER_AUTH_SECRET
npx wrangler secret put INTERNAL_SERVICE_SECRET
# Only when live providers are approved:
# npx wrangler secret put REAPI_API_KEY
# npx wrangler secret put TOPAZ_API_KEY
# npx wrangler secret put OPENAI_API_KEY
# npx wrangler secret put RAPYD_ACCESS_KEY
# npx wrangler secret put RAPYD_SECRET_KEY
# npx wrangler secret put PAYONEER_TOKEN
# npx wrangler secret put PAYFAST_MERCHANT_KEY
# npx wrangler secret put PAYFAST_PASSPHRASE
# npx wrangler secret put PAYSTACK_SECRET_KEY
# npx wrangler secret put GOOGLE_CLIENT_SECRET
# npx wrangler secret put RESEND_API_KEY
# npx wrangler secret put R2_ACCESS_KEY_ID
# npx wrangler secret put R2_SECRET_ACCESS_KEY
```

Generate types after changing bindings:

```bash
npm run cf-typegen
```

Workers preview (same `workerd` runtime as production, local D1/R2):

```bash
npm run preview
# in another terminal:
npm run preview:smoke
```

## Tests

`npm test` discovers every `lib/**/*.test.ts` file (auth, isolation, pipeline, billing, security, bundle scan). D1-backed tests use the local Wrangler persist DB and run one at a time. After `npm run build`, `CINEYOU_REQUIRE_BUNDLE=1 npm run test:bundle` fails if `.next/static` is missing or contains known secret values. `npm run ci` is the local CI-equivalent: typecheck, lint, schema verify, tests, production build, then the required bundle scan.

## Production checklist

- [x] Wrangler secret `BETTER_AUTH_SECRET` set
- [x] Real D1 `database_id` in `wrangler.jsonc`
- [x] R2 bucket `cineyou-production` created and private (no public access / custom domain)
- [x] `AI_PROVIDER_MODE=mock` and `PAYMENTS_MODE=test` explicit in Wrangler `vars`. Concept may be live via `CONCEPT_AI_MODE`.
- [ ] Legal pages reviewed by counsel before launch
- [ ] Do not enable live AI or live payments without an explicit decision
- [x] Worker deployed (`https://cineyou.schalk-966.workers.dev`)
- [x] Public marketing redesign deployed
- [x] Wrangler var `ADMIN_EMAILS` set (`schalk@thewellmedia.com`)
- [x] Wrangler secret `INTERNAL_SERVICE_SECRET` set
- [x] Verify `production30.com` in Resend and upload `RESEND_API_KEY`
- [x] Remote D1 `0006_support_ops` applied; Contact / ticket mail / Admin reply live on the Worker
- [ ] Publish the branding container (Docker must be running)
- [x] Custom domain `production30.thewellmedia.com` on Worker `cineyou` (Wrangler `routes` + `workers_dev`)
- [ ] Custom domain `production30.com` on the Worker

## Common issues

- **Git push did not update production30.thewellmedia.com:** Push only updates GitHub. Add secret `CLOUDFLARE_API_TOKEN` (Edit Cloudflare Workers) or the **Deploy Worker** job fails immediately. Then the Action OpenNext-builds and deploys Worker `cineyou`. Do not use a Pages Git job for this repo.
- **Signup confirmation mail:** Authentication is live. Create an account, confirm the Production30 email from `Accounts@production30.com`, then finish `/onboarding`.
- **Local tests say `no such table: user`:** Wrangler stores local D1 per `database_id`. After that id changes, run `npm run db:migrate:local` and `npm run db:seed:local`.
- **Preview uses local D1:** `npm run preview` does not use `--remote`. It keeps local persist even with a real remote `database_id`.
- **Workflow classes missing from the Worker:** OpenNext generates `.open-next/worker.js`. Production30 wraps it in `worker.ts` so `CommercialProductionWorkflow` and `MediaProcessingService` stay exported.

## Brand

Navy / blue palette from the Production30 logo. Public pages use a lifted navy cinema look; the studio stays darker. Buttons use dark labels (`#001038` on `#1678FF`). Wordmark lives in `public/brand/`.
