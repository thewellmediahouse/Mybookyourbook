# Design Studio — Production Deployment Checklist

Use this before going live on Cloudflare. PayFast supports `sandbox` and `live` via `PAYFAST_MODE`.

## 1. Cloudflare bindings

- [ ] Create D1 database: `npx wrangler d1 create well-media-design-studio`
- [ ] Put the real `database_id` into `wrangler.jsonc` (replace the placeholder UUID)
- [ ] Apply migrations locally: `npm run db:migrate:local`
- [ ] Apply migrations remotely: `npx wrangler d1 migrations apply well-media-design-studio --remote`
- [ ] Confirm migrations `0001_design_studio.sql` and `0002_design_studio_generation_attempts.sql` applied
- [ ] Create R2 bucket: `npx wrangler r2 bucket create well-media-design-studio-assets`
- [ ] Confirm `wrangler.jsonc` bindings: `DESIGN_STUDIO_DB`, `DESIGN_STUDIO_ASSETS`, `ASSETS`

## 2. Worker / site secrets

Set via `wrangler secret put` (or Cloudflare dashboard). Never commit real values.

| Secret | Required | Notes |
|--------|----------|--------|
| `TURNSTILE_SECRET_KEY` | Yes (for generate) | Pair with `PUBLIC_TURNSTILE_SITE_KEY` in Pages/Worker vars |
| `OPENAI_API_KEY` | Yes (AI) | Server only |
| `OPENAI_TEXT_MODEL` | Recommended | e.g. `gpt-4.1-mini` |
| `OPENAI_IMAGE_MODEL` | Recommended | e.g. `gpt-image-1-mini` |
| `PAYFAST_MODE` | Yes | `sandbox` or `live` |
| `PAYFAST_MERCHANT_ID` | Yes (checkout) | Sandbox merchant |
| `PAYFAST_MERCHANT_KEY` | Yes (checkout) | Sandbox key (sent in PayFast form by design) |
| `PAYFAST_PASSPHRASE` | Recommended | Must match PayFast dashboard salt |
| `PUBLIC_SITE_URL` | Yes (checkout) | `https://your-domain` — no trailing slash |
| `DESIGN_STUDIO_NOTIFY_EMAIL` | Recommended | FormSubmit destination for handoffs |
| `DESIGN_STUDIO_TEAM_TOKEN` | Yes (team API) | Long random service token |

Public (safe for client):

- [ ] `PUBLIC_TURNSTILE_SITE_KEY`
- [ ] `PUBLIC_SITE_URL` (also used server-side for PayFast URLs)

## 3. Cloudflare Access (team UI)

Protect these paths with Cloudflare Access (Zero Trust):

- [ ] `/design-your-website/internal*`
- [ ] `/api/design-studio/internal/*`

Team API still requires `DESIGN_STUDIO_TEAM_TOKEN` (`x-design-studio-team-token` or Bearer). Access email headers alone are **not** accepted.

## 4. Turnstile

- [ ] Create a Cloudflare Turnstile widget for the production hostname
- [ ] Set site key as `PUBLIC_TURNSTILE_SITE_KEY`
- [ ] Set secret as Worker secret `TURNSTILE_SECRET_KEY`
- [ ] Confirm generate step shows the widget and fails closed without a token

## 5. OpenAI

- [ ] Billing enabled; image + chat models allowed for the API key
- [ ] Models match env vars
- [ ] Confirm generate creates 4 directions + images in a sandbox project

## 6. PayFast sandbox

- [ ] Sandbox merchant created at https://sandbox.payfast.co.za
- [ ] Passphrase set in sandbox settings
- [ ] `PUBLIC_SITE_URL` is publicly reachable (ITN cannot hit localhost)
- [ ] Notify URL resolves: `{PUBLIC_SITE_URL}/api/design-studio/payfast-notify`
- [ ] Return URL: `/design-your-website/payment/success`
- [ ] Cancel URL: `/design-your-website/payment/cancel`
- [ ] Complete a sandbox payment end-to-end
- [ ] Confirm return page alone does **not** mark paid
- [ ] Confirm ITN marks order `PAID` and project `READY_FOR_DESIGNER`
- [ ] Replay / duplicate ITN stays idempotent
- [ ] Set `PAYFAST_MODE=live` only with live merchant credentials + public `PUBLIC_SITE_URL`

## 7. FormSubmit handoff email

- [ ] `DESIGN_STUDIO_NOTIFY_EMAIL` set to team inbox
- [ ] Activate FormSubmit for that address (one-time confirmation email)
- [ ] Confirm a paid sandbox project triggers a handoff email (or `team_handoff_notify_skipped` is acceptable if email deferred)

## 8. Deploy & verify

- [ ] `npm test` passes
- [ ] `npm run build` passes
- [ ] `npm run deploy` (or CI) succeeds
- [ ] Marketing pages still static (Worker only owns `/api/*` + dynamic results rewrite)
- [ ] Wizard → generate → results → select → contact → PayFast sandbox happy path
- [ ] Custom website type shows quote path (no fabricated price)
- [ ] Internal handoff page loads with team token
- [ ] No `OPENAI_API_KEY`, `PAYFAST_PASSPHRASE`, or `DESIGN_STUDIO_TEAM_TOKEN` in client JS bundles

## 9. Post-deploy smoke

- [ ] `/design-your-website` loads on mobile + desktop
- [ ] Concept images lazy-load on results
- [ ] Upload rejects disallowed MIME / oversized files
- [ ] Project PATCH cannot set `PAID` / `READY_FOR_DESIGNER`
- [ ] Generation capped (max 2 attempts per project after migration 0002)

## Go-live PayFast (separate decision)

1. Live merchant credentials + passphrase
2. Update return/cancel/notify URLs on live merchant
3. Set Worker secret/var `PAYFAST_MODE=live`
4. Low-value live test
5. Confirm ITN + handoff again
