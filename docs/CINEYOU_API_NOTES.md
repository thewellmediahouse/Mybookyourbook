# Production30 API notes

Decision log for external APIs. **Do not invent request fields.** Before implementing a provider, read current official docs and record the date, URL, and any deviation from the master spec.

Default pipeline: `AI_PROVIDER_MODE=mock` and `PAYMENTS_MODE=test`. Commercial Concept may be independently live via `CONCEPT_AI_MODE=live`. Filming Your Commercial may be independently live via `FILMING_AI_MODE=live`. Live enhancement, branding, and Rapyd charges only when those flags are explicitly enabled.

## Rule

1. Consult latest official documentation.
2. Implement a TypeScript adapter interface (real module, not a UI fake).
3. Mock adapter must satisfy the same interface.
4. Log the chosen endpoint, auth method, and webhook verification here.
5. If the official API disagrees with `CINEYOU_MASTER_SPEC.md`, follow the official API and note the difference.

## Providers to consult before implementation

| Provider | When | Official starting points |
| --- | --- | --- |
| OpenNext Cloudflare | Phase 1 | https://opennext.js.org/cloudflare/get-started |
| Cloudflare Workers / Wrangler | Phase 1 | https://developers.cloudflare.com/workers/ |
| Cloudflare D1 | Phase 2 | https://developers.cloudflare.com/d1/ |
| Drizzle + D1 | Phase 2 | https://orm.drizzle.team/docs/get-started/d1-new |
| Better Auth + D1/Drizzle | Phase 3 | https://www.better-auth.com/docs |
| Cloudflare R2 presigned URLs | Phase 7–8 | https://developers.cloudflare.com/r2/api/s3/presigned-urls/ |
| OpenAI structured output | Phase 11 | https://platform.openai.com/docs |
| reAPI Seedance 2.5 | Phase 16 (replaced fal.ai) | https://reapi.ai/docs/seedance-2-5 |
| Topaz Labs Video API | Phase 17 | Topaz Labs developer docs (current Video API) |
| Cloudflare Workflows | Phase 15 | https://developers.cloudflare.com/workflows/ |
| Cloudflare Containers | Phase 18 | https://developers.cloudflare.com/containers/ |
| Cloudflare Queues | Phase 20 | https://developers.cloudflare.com/queues/ |
| Paystack | Phase 14 (unused leftover) | https://paystack.com/docs |
| Rapyd Collect | Payments (primary) | https://docs.rapyd.net/en/create-checkout-page.html |
| Payoneer Checkout | Payments (unused leftover) | https://checkoutdocs.payoneer.com/ / https://www.npmjs.com/package/@payoneer/op-payment-widget-v3 |
| PayFast | Payments (unused leftover) | https://developers.payfast.co.za/docs |
| Resend | Phase 20 | https://resend.com/docs |

## Decision log

### 2026-08-20 — Phase 1 OpenNext

- OpenNext Cloudflare get-started (fetched 2026-08-20): `main` must be `.open-next/worker.js`; assets `.open-next/assets` with binding `ASSETS`.
- Keep `nodejs_compat` and `global_fetch_strictly_public` even though Workers may default nodejs_compat after 2026-08-04 — OpenNext still documents both flags.
- `initOpenNextCloudflareForDev()` in `next.config.ts` for local bindings.
- Worker name: `cineyou` (replaces `astro-business-template`).
- Compatibility date: `2026-08-20`.
- Workflow and Container classes cannot live only in Next.js route files; they must be exported from the Worker. Phase 15 added `worker.ts` (OpenNext custom worker). Containers remain Phase 18.

### Contrast (design tokens)

- Spec palette locked 2026-08-22. Button labels use `#001038` on `#1678FF` (~4.6:1).
- `#FFFFFF` on `#1678FF` is ~4.1:1 and must not be used for button text.
- Public marketing/auth (2026-08-24) is a lifted navy cinema surface `#1A2033`, not white and not pure black. Do not use `#1678FF` as small text there (~4.0:1). Public accent ink is `#5AA3FF`.

### 2026-08-20 — Phase 2 D1 / Drizzle

- Generate SQL with `drizzle-kit generate` (sqlite dialect, no `d1-http` credentials). Apply with `wrangler d1 migrations apply cineyou-production --local`.
- `migrations_dir` is `drizzle` (top-level `*.sql` from current drizzle-kit; no `migrations_pattern` needed).
- Better Auth tables named `user` / `session` / `account` / `verification` per Drizzle adapter docs. Timestamps use `unixepoch() * 1000` (D1-safe; not `unixepoch('subsecond')`).
- Plans seeded from spec ZA/INT list prices. No fake users or revenue.
- Remote D1 id remains placeholder until `wrangler d1 create`.

### 2026-08-20 — Phase 3 Better Auth

- Packages: `better-auth@1.7.1`, `@better-auth/drizzle-adapter@1.7.1`.
- Drizzle adapter docs (fetched 2026-08-20): `transaction` **defaults to `false`**. Explicit `transaction: false` kept for D1 (no interactive transactions).
- Better Auth 1.7 account identity: required `issuer` plus unique `(issuer, account_id)` index. Credential accounts use `local:credential` (library-assigned). Empty D1 had no rows to backfill.
- OpenNext 1.20.2 cannot bundle Next.js 16 `proxy.ts` (Node middleware). Cookie guards stay in Edge `middleware.ts` until that adapter support is in our pin. Page-level `getSession` / `requireUser` remain the real guard.
- `nextCookies()` is last in `plugins`. Handler: `app/api/auth/[...all]/route.ts` via `toNextJsHandler`.
- Email: Resend `POST https://api.resend.com/emails` when `RESEND_API_KEY` and `EMAIL_FROM` are set; otherwise mock logs `[production30:email:mock]`.
- Google OAuth: `socialProviders.google` only if both `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are non-empty.
- Website import during onboarding is an interface only (`BusinessImporter`). Mock returns `unavailable` with empty fields so we never invent a company from a URL. A real importer lands when that phase is scheduled.

### 2026-08-20 — Phase 7 R2 signed uploads

- Official docs (fetched 2026-08-20): [Presigned URLs](https://developers.cloudflare.com/r2/api/s3/presigned-urls/), [Upload objects](https://developers.cloudflare.com/r2/objects/upload-objects/), [CORS](https://developers.cloudflare.com/r2/buckets/cors/).
- Workers path uses `aws4fetch` `AwsClient` against `https://<ACCOUNT_ID>.r2.cloudflarestorage.com/<bucket>/<key>` with `aws: { signQuery: true }` and `X-Amz-Expires`. PUT 15 minutes, GET 30 minutes (inside spec 10–20 / 15–60).
- PUT signs `Content-Type`. The browser must send the same header. Allowlist: `image/png`, `image/jpeg`, `image/webp`, `image/svg+xml`. Max 5 MB for logos.
- S3 credentials (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`) are required for browser PUT directly to R2. CORS must allow the app origin, `PUT`, and `Content-Type`.
- Local / preview without those secrets uses the `MEDIA_BUCKET` Worker binding after the same authz + key-prefix checks. Bytes still never go to D1. This is not a public URL.
- Object keys: `workspaces/{workspaceId}/brands/{businessId}/logo/{uuid}`. D1 stores the key only, never a signed URL.

### 2026-08-20 — Phase 8 AI Identity

- Same R2 signed PUT / binding PUT path as logos. Identity MIME allowlist is PNG/JPEG/WebP for stills (no SVG) and `video/mp4`, `video/webm`, `video/quicktime`, `video/x-m4v` for the reference video. MediaRecorder codecs are stripped (`video/webm;codecs=...` → `video/webm`) before signing Content-Type.
- Object keys: `workspaces/{workspaceId}/users/{userId}/identity/{front|left|right|reference-video}/{uuid}`. Completing a slot deletes the previous `identity_assets` row first (unique on identity + role), then inserts the new link. Delete removes R2 objects immediately in this phase; a cleanup queue is still Phase 20.
- Consent version stored as `identity-v1`. Uploads return 400 until that consent row exists. Playback uses authenticated `/api/assets/[assetId]` (Worker GET), not a stored signed URL.

### 2026-08-20 — Phase 9 Media library

- Same signed PUT / binding PUT path as logos and identity. Library stills: PNG/JPEG/WebP up to 8 MB. SVG only on the Logos tab, 5 MB. Complete responses are `{ ok, assetId }` only — no public URL and no stored signed URL.
- Object keys: `workspaces/{workspaceId}/brands/{businessId}/assets/{logo|product|business|location|campaign}/{uuid}`. Official brand logos stay under `.../logo/{uuid}` and appear on the Logos tab; they are not deleted from this screen.
- Identity keys are rejected by `assertLibraryObjectKey`. `listMediaAssets` / the library query omit `category: identity`. Delete marks `deletedAt` and removes the R2 object immediately (cleanup queue still Phase 20). Playback: authenticated Worker GET at `/api/assets/[assetId]` and `/api/media/assets/[assetId]/play`.
- CREATOR and above can add/remove library files. VIEWER can look, not change. Uploads require a signed-in studio member; object keys cannot target another workspace.

### 2026-08-20 — Phase 10 Commercial wizard

- No new external provider. Brief fields persist on `projects` (`tone_json` holds selected tones plus “avoid saying”). Contextual photos: `workspaces/{workspaceId}/projects/{projectId}/references/{uuid}` plus optional attach from the media library. Identity assets cannot be attached. Maximum 6 extra photos (`CONTEXT_1`…`CONTEXT_6` internally; customers never see those names).
- Platform can recommend 9:16 / 16:9 / 1:1. The chosen aspect ratio is only saved when the user clicks it. `auto` is rejected. Concept/Approve/Produce remain closed.

### 2026-08-20 — Phase 11 Creative Director

- Official Structured Outputs docs (fetched 2026-08-20): [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Current REST path is `POST https://api.openai.com/v1/responses` with `Authorization: Bearer $OPENAI_API_KEY` and `text.format` `{ type: "json_schema", name, strict: true, schema }`. We use `fetch`, not the OpenAI SDK.
- Chat Completions `response_format.json_schema` is still documented for older snapshots; this phase follows the current Responses examples. Default model is `OPENAI_MODEL` or `gpt-4o-mini` (listed for structured outputs). Do not hardcode a single model as the only option.
- Strict schema: all properties required, `additionalProperties: false`. Optional scene fields are `["string","null"]`. Invalid JSON/Zod output retries once. Default mock never calls this endpoint, even if `OPENAI_API_KEY` is set. `CONCEPT_AI_MODE=live` or `AI_PROVIDER_MODE=live` uses OpenAI. Live concept without a key does not silently mock.
- Concept generate/regenerate is 0 credits. Production credit spend is still Phase 13.

### 2026-08-20 — Phase 12 Prompt builder

- No external HTTP. Pure function at `lib/providers/video/seedance/prompt-builder.ts`. fal.ai Seedance submit/status is still Phase 16.
- Identity tokens match Phase 8 mapping: `@Image1` front, `@Image2` left, `@Image3` right, `@Video1` presenter. Extra campaign stills: `@Image4`–`@Image9` for `CONTEXT_1`–`CONTEXT_6`.
- On approve, `seedance_prompt` is replaced with the builder output and stored on the immutable creative version. It is never returned in the public concept DTO.

### 2026-08-20 — Phase 13 Credits

- No external HTTP. Spend is a D1 conditional `UPDATE credit_wallets SET balance = balance - 1 WHERE workspace_id = ? AND balance >= 1`, then a ledger row with unique `idempotency_key` (`generation:{projectId}:{attemptId}`). Same key returns the existing row and does not decrement again. Technical refund key is `technical-refund:{generationKey}`.
- Concept generation still spends 0. Production start (Phase 15) will call `reserveGenerationCredit` before creating a workflow. This phase does not take a credit on Approve.

### 2026-08-20 — Phase 14 Paystack

- Official Transaction API (fetched 2026-08-20): [Initialize / Verify](https://docs-v2.paystack.com/api/transaction/). Base `https://api.paystack.co`. Auth `Authorization: Bearer $PAYSTACK_SECRET_KEY`.
- Initialize: `POST /transaction/initialize` with `email`, `amount` as a **string** of minor units, `currency`, `reference` (`-`, `.`, `=` and alphanumeric), `callback_url`, `metadata` as stringified JSON. Optional `plan` (Paystack plan code) invalidates `amount` per docs. Response: `authorization_url`, `access_code`, `reference`.
- Verify: `GET /transaction/verify/:reference`. Fulfil only when `data.status === "success"` and `amount` / `currency` match our catalog plan and the studio billing currency. We do not grant from the redirect query string even when Paystack appends `reference`.
- Webhooks (Paystack payments webhooks docs, 2026-08-20): POST JSON `{ event, data }`. Header `x-paystack-signature` is HMAC-SHA512 hex of the **raw body** with the secret key. We hash the received bytes (`node:crypto` `createHmac('sha512')`) and compare with `timingSafeEqual`. We do not `JSON.stringify` a parsed object to verify. Return 200 after handling (including rejected amount/currency) so Paystack does not retry a known-bad charge into a grant. Invalid signature → 400.
- Disable subscription: `POST /subscription/disable` `{ code, token }` (subscription code + email token). Email token is stored packed on `subscriptions.provider_customer_id` when the webhook includes it. Without a token, cancel returns an honest error.
- `PAYMENTS_MODE=test` without a secret: mock adapter, no HTTP. `sk_test_` in test mode: Paystack test API. `sk_live_` in test mode: refused. `PAYMENTS_MODE=live` requires `sk_live_` and does not fall back to mock.
- Grant idempotency: `purchase:paystack:{reference}`. Event idempotency: unique `(provider, provider_event_id)` on `payment_events`.

### 2026-08-20 — Phase 15 Cloudflare Workflows + OpenNext custom worker

- Official Workflows Workers API (fetched 2026-08-20): [Workers API](https://developers.cloudflare.com/workflows/build/workers-api/), [Wrangler `workflows`](https://developers.cloudflare.com/workers/wrangler/configuration/#workflows). Binding: `{ name, binding, class_name }`. `script_name` is only for a class defined in another Worker. Same-worker class is exported from `worker.ts`.
- Create: `env.COMMERCIAL_PRODUCTION_WORKFLOW.create({ id, params })`. Params are `event.payload` on `WorkflowEntrypoint.run`. `step.do(name, callback)` persists JSON-serializable results. Byte payloads between steps are `number[]` (`Array.from`), not `Uint8Array`.
- OpenNext custom worker (fetched 2026-08-20): [Custom Worker](https://opennext.js.org/cloudflare/howtos/custom-worker). `wrangler.jsonc` `main` is `worker.ts`, which re-exports generated `.open-next/worker.js` `fetch` (plus `DOQueueHandler` / `DOShardedTagCache`) and exports `CommercialProductionWorkflow`. `worker.ts` is excluded from `tsc` because `.open-next/worker.js` does not exist until an OpenNext build.
- Local `next dev` / `getPlatformProxy` do not bind Workflows. `/api/production/start` then uses `waitUntil` + mock providers so the browser is not held on filming. Credit is reserved **before** `create` / `waitUntil`. Duplicate in-flight starts are rejected. Technical failure refunds once.
- Mock Seedance / Topaz / branding only. `AI_PROVIDER_MODE=live` throws customer-safe “not connected yet” until Phases 16–18. No paid HTTP in this phase.

### 2026-08-20 — Phase 16 Seedance 2.5 via fal.ai

- Official model page (fetched 2026-08-20): [Seedance 2.5 reference-to-video](https://fal.ai/models/bytedance/seedance-2.5/reference-to-video). Model ID `bytedance/seedance-2.5/reference-to-video`. Queue docs: [Asynchronous Inference](https://docs.fal.ai/model-endpoints/queue).
- Auth: `Authorization: Key $FAL_KEY` (server-only). No `@fal-ai/client`; raw `fetch` like the OpenAI adapter.
- Submit: `POST https://queue.fal.run/bytedance/seedance-2.5/reference-to-video`. Status: `GET .../requests/{request_id}/status`. Result: `GET .../requests/{request_id}`, then download `video.url`. Request IDs must match `^[A-Za-z0-9._-]{8,128}$` before interpolation.
- Locked input (spec vs API default 720p/`auto`): `resolution: "480p"`, `duration: "30"` (string enum), `generate_audio: true`, `aspect_ratio` from the brief (`9:16` / `16:9` / `1:1`; never `auto`). Official optional fields used: `image_urls`, `video_urls`. Identity maps `@Image1–3` / `@Video1`; campaign stills `@Image4–9`. Empty arrays are omitted. `bitrate_mode` and `audio_urls` are not sent.
- We poll from the Workflow (`step.sleep` 15s, up to 60 attempts) instead of fal webhooks. Official webhook verification is JWKS ED25519 (`X-Fal-Webhook-*` + `https://rest.fal.ai/.well-known/jwks.json`), not `FAL_WEBHOOK_SECRET`. That env var remains unused.
- `AI_PROVIDER_MODE=mock` never calls fal even if `FAL_KEY` is set. Live without a key does not silently mock; submit fails with “Live filming is not connected yet.” Live HTTP errors use a customer-safe filming message. Reference files are short-lived signed R2 GET URLs (1 hour) when S3 credentials are configured.

### 2026-08-22 — Seedance 2.5 live path moved to reAPI

- Official docs (fetched 2026-08-22): [Seedance 2.5](https://reapi.ai/docs/seedance-2-5), [model page / pricing](https://reapi.ai/models/seedance-2-5), [Tasks](https://reapi.ai/docs/api/tasks), [Overview](https://reapi.ai/docs/api).
- Why not fal / BytePlus first-party: BytePlus LAS rejects raw HTTPS URLs of real human faces unless they are `asset://` allowlisted. Production30 always sends 3 identity photos + presenter video. reAPI documents that reference images and videos may contain real people. Published 480p + uploaded-video rate is $0.072/s; with video-ref billable seconds `max(output + ceil(source), ceil(5/3 × output))` a 30s take is usually ~$3.60 vs fal ~$5.29.
- Model: `doubao-seedance-2.5-face`. Auth: `Authorization: Bearer $REAPI_API_KEY` (server-only). No SDK; raw `fetch`.
- Submit: `POST https://reapi.ai/api/v1/videos/generations`. Poll: `GET https://reapi.ai/api/v1/tasks/{id}` (same envelope). Official statuses: `processing` / `completed` / `failed`. Download `output.video_urls[0]` (HTTPS CDN; copy immediately). Task IDs must match `^[A-Za-z0-9._-]{8,128}$` before interpolation. HTTP 429 on poll is treated as still processing. Polling does not consume credits. Official `Idempotency-Key` is telemetry-only and is not sent.
- Locked input (official default is 720p / `duration` 5 / `size` adaptive): `resolution: "480p"`, `duration: 30` (integer, not string), `size` from the brief (`9:16` / `16:9` / `1:1`; never `auto` or `adaptive`), `generate_audio: true`, `output_format: "mp4"`, `omni_reference_task_type: "reference"` so submit is checked as a reference job (official 2026-08-30). Official optional fields used: `image_urls` (≤30), `video_urls` (≤10). Identity maps `@Image1–3` / `@Video1`; campaign stills `@Image4–9`. Empty arrays are omitted. Not sent: `audio_urls`, `image_with_roles`, `tools`, `return_last_frame`, `content_filter: false` (default safety stays on), `bitrate_mode`.
- Official reference clips (fetched 2026-08-30): mp4 or mov, H.264/H.265. WebM/Matroska is a synchronous 400, nothing charged. Chrome Record Now often stores `video/webm`; we prefer `video/mp4` when the browser supports it and refuse WebM before submit.
- Workflow still polls with `step.sleep` 15s. `FILMING_AI_MODE=live` (or `AI_PROVIDER_MODE=live` when filming mode is unset) calls reAPI. `FILMING_AI_MODE=mock` never calls reAPI even if `REAPI_API_KEY` is set. Live without a key does not silently mock. Customer errors stay “Live filming is not connected yet.” / “We couldn't complete filming right now.” Reference files use short-lived R2 S3 GET URLs when those secrets are set; otherwise a 1-hour HMAC GET on `/api/provider/files/{token}` streamed from the `MEDIA_BUCKET` binding (`INTERNAL_SERVICE_SECRET`). Official: no `data:` URIs. Missing signer fails immediately (`REFERENCES_UNSIGNED`) without the default 5-minute Workflow retry. Mock enhancement/branding keep the filmed file; they do not replace it with the development fixture.
- Master spec still names fal.ai as the original Phase 16 target. Live filming now follows this reAPI contract.

### 2026-08-20 — Phase 17 Topaz Video API (Proteus `prob-4`)

- Official docs (fetched 2026-08-20): [Video Quickstart](https://developer.topazlabs.com/getting-started/video-quickstart), [Create Request](https://developer.topazlabs.com/reference/api-endpoints/video/create-request.md), [Accept](https://developer.topazlabs.com/reference/api-endpoints/video/accept-request.md), [Complete upload](https://developer.topazlabs.com/reference/api-endpoints/video/complete-upload.md), [Status](https://developer.topazlabs.com/reference/api-endpoints/video/get-request-status.md), [Proteus `prob-4`](https://developer.topazlabs.com/video-models/proteus/proteus.md).
- Base `https://api.topazlabs.com`. Auth header `X-API-Key: $TOPAZ_API_KEY` (not Bearer). No Topaz SDK; raw `fetch` like fal/OpenAI.
- Create: `POST /video/` (trailing slash). Required `source`, `filters`, `output`. Does not consume credits or start processing. Response `{ requestId, estimates }`. Request IDs are UUIDs; we reject anything that is not a UUID before interpolating.
- `filters[0].model` default `prob-4` (`TOPAZ_DEFAULT_MODEL`). Only official UpscaleFilter enum values are sent. We do not send Proteus extras (`compression`, `details`, …).
- Output 1080p from the brief aspect ratio: 16:9 → 1920×1080, 9:16 → 1080×1920, 1:1 → 1080×1080. Source estimate is 480p at the same aspect (`duration` 30, `frameRate` 24, `frameCount` 720) until Phase 18 ffprobe. Output uses `audioCodec: "AAC"`, `audioTransfer: "Copy"`, `dynamicCompressionLevel: "High"`, `container: "mp4"`, `videoEncoder: "H264"`.
- Accept: `PATCH /video/{requestId}/accept` → `{ uploadId, urls[] }`. Split source bytes across `urls.length` and `PUT` each HTTPS URL with `Content-Type: video/mp4`. Keep the `ETag` from each PUT.
- Complete: `PATCH /video/{requestId}/complete-upload` (no trailing slash, matching the quickstart) with `{ uploadResults: [{ partNum, eTag }] }`. `partNum` starts at 1. `uploadUrls` are persisted in the Workflow `submit-topaz` step result so they survive `step.do` resumes. ETags stay in the same `upload-topaz` step as `completeUpload`.
- Status: `GET /video/{requestId}/status`. In-flight: `requested` / `accepted` / `initializing` / `preprocessing` / `processing` / `postprocessing`. Terminal: `complete` (then `download.url`, TTL ~24h), `failed` / `canceled`. Workflow polls with `step.sleep` 15s, up to 120 attempts. We download `download.url` server-side, store bytes in private R2, and never persist that URL for customers.
- `AI_PROVIDER_MODE=mock` never calls Topaz even if `TOPAZ_API_KEY` is set. Live without a key does not silently mock; create fails with “Live enhancement is not connected yet.” Live HTTP errors use a customer-safe enhancement message. Customers still see Enhancing Your Footage.

### 2026-08-20 — Phase 18 Cloudflare Containers + media branding

- Official docs (fetched 2026-08-20): [Containers get started](https://developers.cloudflare.com/containers/get-started/), [Container class](https://developers.cloudflare.com/containers/container-class/), [Wrangler containers](https://developers.cloudflare.com/workers/wrangler/configuration/#containers). Package `@cloudflare/containers` `Container` + `getContainer`. Image must be `linux/amd64`.
- Wrangler: `containers` image `./containers/media-processing/Dockerfile`, `class_name` `MediaProcessingService`, `instance_type` `standard-1`, `max_instances` 5. Durable Object binding `MEDIA_PROCESSING` with `new_sqlite_classes` migration tag `v1`. The class is exported from `worker.ts` (same OpenNext custom worker as the Workflow). `enableInternet` is false. `sleepAfter` is 15m. Health is `GET /health` (no secret; used by the Container class ping). Branding is `POST /brand` only.
- There is no public Next.js FFmpeg route. The Worker Durable Object `fetch` requires `X-Internal-Secret: $INTERNAL_SERVICE_SECRET` before proxying to the container. The container checks the same header against its env. Arbitrary commands are not accepted — only inspect/brand with a video upload and a JSON options object of structured profile fields.
- Overlay copy is built only from stored brand fields (CTA, phone, WhatsApp, website). Empty fields are omitted. Logo positions: `none` / `top-left` / `top-right` / `bottom-left` / `bottom-right` (default bottom-right). Optional 2.5s end card only when at least one of those fields is present. Final encode: H.264, AAC, 1080p canvas, `+faststart`. Poster-frame thumbnail. Probed width/height/duration/fps/codecs stored on the final `assets` row. Temporary files stay on ephemeral container disk.
- Workflow branding reads the enhanced file from private R2 and writes final + thumbnail to R2 inside the step (no video bytes in the persisted step result). `AI_PROVIDER_MODE=mock` never calls the container. Live without secret or binding does not silently mock (“Adding your brand in post is not connected yet.”). Customers still see Adding Your Brand.
- `wrangler.jsonc` `dev.enable_containers` is `false` so `getPlatformProxy` / `next dev` do not require Docker. Production `wrangler deploy` / OpenNext deploy still builds and rolls out the image. To try the container locally, install Docker and set `enable_containers` to `true`.

### 2026-08-20 — Phase 19 customer delivery (authenticated stream, not stored signed URLs)

- The implementation plan mentioned R2 signed GET for playback/download. Playback already uses an authenticated Worker stream (`GET /api/assets/{assetId}`) with `Cache-Control: private, max-age=60`. Download uses the same route with `?download=1` and `Content-Disposition: attachment; filename="cineyou-{business}-{campaign}-1080p.mp4"`. Signed URLs are still never stored. This keeps project access on every GET and matches the existing private-media design.
- Format versions do not crop landscape to vertical (or the reverse). They open a new draft with the requested aspect ratio. Concept generation stays free; producing that draft spends 1 Ad Credit.

### 2026-08-20 — Phase 20 Resend + Cloudflare Queues

- Official Resend send (fetched 2026-08-20): [Send Email](https://resend.com/docs/api-reference/emails/send-email), [Idempotency keys](https://resend.com/docs/dashboard/emails/idempotency-keys). `POST https://api.resend.com/emails` with `Authorization: Bearer $RESEND_API_KEY`. Optional header `Idempotency-Key` (1–256 chars, unique per request, retained 24h). Concurrent same-key in-flight returns `409 concurrent_idempotent_requests` (safe to retry). Same key with a different body returns `409 invalid_idempotent_request`. Better Auth verify/reset tokens are JWTs that share a header prefix — keys must use the token tail (or a hash), not the first 80 characters, or later signups are rejected and no mail is sent. We send `from`, `to[]`, `subject`, `text`, and `html`. No attachments. No Resend SDK.
- Without `RESEND_API_KEY` and `EMAIL_FROM`, the mock provider logs `[production30:email:mock]` and does not call Resend. Auth welcome/verify/reset and production/billing receipts share the same templates.
- Official send `from` (fetched 2026-08-20): [Send Email](https://resend.com/docs/api-reference/emails/send-email) accepts `email@domain` or `Name <email@domain>`. From 2026-08-22 the product from-address is `Production30 <Accounts@production30.com>`. Resend requires the from-domain to be verified ([Add a domain](https://resend.com/docs/add-a-domain)). The send-only key cannot list domains (`GET /domains` → 401 `restricted_api_key`) but can send once the domain is verified. Confirmed 2026-08-22: `POST /emails` from that address to `delivered@resend.dev` returned 200. `RESEND_API_KEY` is now a Worker secret. Signup will send real confirmation mail.
- Official Queues (fetched 2026-08-20): [JavaScript APIs](https://developers.cloudflare.com/queues/configuration/javascript-apis/), [Wrangler queues](https://developers.cloudflare.com/workers/wrangler/configuration/#queues). Producer: `env.NOTIFICATION_QUEUE.send(body)` / `env.CLEANUP_QUEUE.send(body)`. Consumer: `queue(batch, env)` on the OpenNext custom worker (`worker.ts`), `message.ack()` / `message.retry()`. Wrangler: `queues.producers` bindings `NOTIFICATION_QUEUE` → `cineyou-notifications`, `CLEANUP_QUEUE` → `cineyou-cleanup`; matching `queues.consumers` with `max_batch_size` 10.
- Queue send is used when `NEXTJS_ENV=production` and the binding exists. `next dev` / tests (`NEXTJS_ENV=development`) deliver email inline so local studio still gets notices without a running consumer. A failed queue send is swallowed after the commercial is saved.

### 2026-08-20 — Phase 21 team invite email

- No new email provider. Studio invitations reuse the Phase 20 Resend `team-invite` template (`INVITE_EMAIL_SUBJECT`: You're invited to a Production30 studio). The accept link is `/invite/accept?token=`; only the SHA-256 hash of the token is stored. Idempotency keys are `team-invite/{invitationId}/{tokenHash prefix}` so a resend with a new token is a new send.

### 2026-08-20 — Phase 23 Workers Rate Limiting

- Official Rate Limiting API (fetched 2026-08-20): [Workers Rate Limiting](https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/). Wrangler `ratelimits[]` with `name`, `namespace_id` (string integer, unique per account), and `simple: { limit, period }` where `period` must be `10` or `60` seconds. Call `env.BINDING.limit({ key })` → `{ success }`. Keys should be stable actors (email, workspace id), not IP addresses. Limits are per Cloudflare location and eventually consistent. Local / tests: binding is optional; D1 `rate_limit_events` is the source of truth for longer windows (signup, production, checkout).
- Bindings: `AUTH_RATE_LIMIT` (10 / 60s, key `signup|login|reset:{email}`), `PRODUCTION_RATE_LIMIT` (5 / 60s, key `production:{workspaceId}`). Missing binding is a no-op so `next dev` and `getPlatformProxy` still run.

### 2026-08-20 — Phase 25 Cloudflare preview (no live deploy)

- OpenNext preview (fetched 2026-08-20): [CLI](https://opennext.js.org/cloudflare/cli), [Get started](https://opennext.js.org/cloudflare/get-started). `opennextjs-cloudflare preview` populates local cache then `wrangler dev` (workerd). Do not call `wrangler dev` directly. `--remote` is off so preview uses local D1/R2 persist, not the provisioned remote resources.
- Wrangler env (fetched 2026-08-20): [Environment variables](https://developers.cloudflare.com/workers/configuration/environment-variables/), [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/). Non-secret modes are `vars`: `AI_PROVIDER_MODE=mock`, `PAYMENTS_MODE=test`. Secrets stay in `.dev.vars` locally. `wrangler secret put` deploys a new Worker version, so secrets were not uploaded.
- Account resources created (WEUR): D1 `cineyou-production` id `a0dff7a4-9637-4b25-9941-b1b35e336e06` (migrations + plan seed applied remotely); private R2 `cineyou-production`; queues `cineyou-notifications` and `cineyou-cleanup`. The Worker script was not deployed.
- Local preview port is `8787` (`wrangler.jsonc` `dev.port`) so it does not share `next dev` on 3000. Observability `enabled` + `head_sampling_rate` 1 per Workers best practices.
- `@opennextjs/cloudflare@1.20.2` still exits on Next.js 16 `proxy.ts` (Node middleware): “Node.js middleware is not currently supported.” Session cookie guards stay in Edge `middleware.ts` (`export function middleware`) until that adapter support is in our pinned version. `nodejs_compat` remains on.

### 2026-08-22 — PayFast is the payment provider

- Official Custom Integration (fetched 2026-08-22): [PayFast docs](https://developers.payfast.co.za/docs). Checkout is a form POST to `https://www.payfast.co.za/eng/process` (sandbox: `sandbox.payfast.co.za`). Required fields: `merchant_id`, `merchant_key`, `amount` (ZAR decimal, min R5.00), `item_name`.
- Signature: MD5 of non-blank name/value pairs in **attribute order** (not alphabetical), PHP-style urlencode (spaces `+`, hex uppercase), optional `&passphrase=`. Do not use the API alphabetical signature format.
- ITN: POST `application/x-www-form-urlencoded` to `notify_url` (`/api/webhooks/payfast`). Grant only when `payment_status=COMPLETE`. Verify MD5 using posted field order until `signature`, then confirm with `POST /eng/query/validate` expecting `VALID`. Match `amount_gross` to the catalog amount (±1 cent after converting to minor units). Match `merchant_id`. Redirect `return_url` / `cancel_url` never grants credits.
- Official IP/DNS host check is not used on Workers (`gethostbynamel` is not reliable here). Signature + server validate + merchant id + amount/currency/plan checks are the grant gates.
- Official Custom Integration `amount` is always ZAR ([PayFast docs](https://developers.payfast.co.za/docs), fetched 2026-08-22). PayFast Multi-Currency Pricing can show another currency on their hosted page; the merchant POST is still rand.
- USD catalog plans are converted at a locked commercial rate (`PAYFAST_USD_ZAR_RATE`, default `18.5`) and charged in ZAR. The payment row stores the rand amount; ITN `amount_gross` must match that snapshot. Credits come from the dollar plan. This is not a live FX quote. EUR and other catalog currencies stay closed. Monthly / recurring fields (`subscription_type`, `frequency`, `cycles`, passphrase required) are not wired; monthly buttons stay closed.
- `PAYMENTS_MODE=test` without sandbox credentials: mock adapter, no HTTP. Live PayFast (`PAYFAST_MODE=live`) in test mode is refused. `PAYMENTS_MODE=live` requires `PAYFAST_MODE=live` plus merchant id/key and does not fall back to mock. Sandbox credentials are refused in live payments mode.
- Grant idempotency: `purchase:payfast:{m_payment_id}`. Event idempotency: `payfast` + `pf_payment_id`. Paystack adapter and `/api/webhooks/paystack` remain in the repo unused.

### 2026-08-25 — Payoneer Checkout is the payment provider

- Official widget / LIST (fetched 2026-08-25): [@payoneer/op-payment-widget-v3](https://www.npmjs.com/package/@payoneer/op-payment-widget-v3), hosted page assets at `checkout.payoneer.com/paymentpage/v3`. Authenticated merchant call is **POST `/lists`**. Hosts: `https://api.sandbox.oscato.com/api/lists` and `https://api.live.oscato.com/api/lists`. Auth: HTTP Basic (merchant code as username, payment token as password). `Content-Type` / `Accept`: `application/vnd.optile.payment.enterprise-v1-extensible+json`.
- LIST body uses documented fields only: `transactionId`, `country` (ISO 3166-1 alpha-2), `customer.number`, `customer.email`, `payment.amount` (major units), `payment.currency`, `payment.reference`, `callback.returnUrl`, `callback.cancelUrl`, `callback.notificationUrl`, `style.hostedVersion: "v3"`. Hosted redirect: `https://resources.{sandbox|live}.oscato.com/paymentpage/v3/responsive.html?listUrl=`.
- The public cards demo also posts `https://api.{env}.oscato.com/checkout/session` with a `division` id. That is a playground helper, not the merchant LIST we call.
- Notifications POST JSON to `/api/webhooks/payoneer` (`longId`, `transactionId`, interaction fields). We do **not** grant from that body or from `returnUrl`. Confirm with `GET /api/charges/{longId}` (same Basic auth) and require `status.code === "charged"`. Amount is converted to minor units by rounding. Match stored payment amount/currency/plan. Invalid JSON → 400. GET failure other than 404 → 500 so Payoneer can retry. Pending/non-charged → 200, no credits.
- Catalog ZAR and USD are charged in that currency. No USD→ZAR conversion. EUR stays closed. Monthly / recurring is not wired; monthly buttons stay closed.
- `PAYMENTS_MODE=test` without sandbox credentials: mock adapter, no HTTP. Live Payoneer (`PAYONEER_MODE=live`) in test mode is refused. `PAYMENTS_MODE=live` requires `PAYONEER_MODE=live` plus username/token and does not fall back to mock. Sandbox credentials are refused in live payments mode.
- Grant idempotency: `purchase:payoneer:{transactionId}`. Event idempotency: `payoneer` + charge `longId`. A personal Payoneer wallet is not Checkout merchant credentials; Checkout onboarding is required. PayFast and Paystack adapters remain unused.
- Payoneer Checkout merchant eligibility is decided by Payoneer (their public Checkout page has previously mentioned entity and volume requirements). We do not invent a connected account.

### 2026-08-25 — Support mail and money returns (no Payoneer refund API)

- New Help / Contact tickets email `ADMIN_EMAILS` (`support-staff`) and the customer (`support-received`). Staff replies email the customer (`support-reply`) through the existing Resend adapter. No Intercom/Crisp.
- Money returns are recorded in D1 after staff refund in the **Payoneer Checkout dashboard**. Official Checkout list/charge docs used for payments do not document a merchant refund HTTP we can call; do not invent `POST /refunds`. Payment status becomes `refunded`. Ad Credits are not granted from that action.
- Monthly cancel still cannot self-serve. Staff sets `cancelAtPeriodEnd` in D1 after stopping the plan in Payoneer.

### 2026-08-28 — Rapyd Collect is the payment provider

- Official Collect (fetched 2026-08-28): [Create Checkout Page](https://docs.rapyd.net/en/create-checkout-page.html) `POST https://sandboxapi.rapyd.net/v1/checkout` (live host `api.rapyd.net`). [Request signatures](https://docs.rapyd.net/en/request-signatures.html): `BASE64(HMAC-SHA256(http_method + url_path + salt + timestamp + access_key + secret_key + body).digest("hex"))`. Official Node sample hashes **hex then Base64**. `url_path` starts at `/v1` and includes query string when present. Headers: `access_key`, `salt`, `timestamp`, `signature`, optional `idempotency`.
- Checkout body uses documented fields only: `amount` (major units), `country` (ISO 3166-1 alpha-2), `currency`, `merchant_reference_id`, `metadata`, optional `complete_checkout_url` / `cancel_checkout_url`. Hosted redirect is `redirect_url` on `sandboxcheckout.rapyd.net` (or live checkout). Those return URLs **do not support localhost**; we omit them unless the callback is public HTTPS. Catalog ZAR and USD are charged in that currency. EUR stays closed. Monthly / recurring is not wired; monthly buttons stay closed.
- Webhooks: [Webhook authentication](https://docs.rapyd.net/en/webhook-authentication.html) omits HTTP method; `url_path` is the **full** configured webhook URL. [PAYMENT_COMPLETED](https://docs.rapyd.net/en/payment-completed-webhook.html) (and PAYMENT_SUCCEEDED as a retrieve trigger) POST JSON to `/api/webhooks/rapyd`. We do **not** grant from that body or from the browser return. Confirm with signed `GET /v1/payments/{payment_id}` ([Retrieve Payment](https://docs.rapyd.net/en/retrieve-payment.html)) and require `status === "CLO"` **and** `paid === true`. PAYMENT_SUCCEEDED can be `ACT` during 3DS. Amount is converted to minor units by rounding. Match stored payment amount/currency/plan. Invalid JSON or bad signature → 400. GET failure other than 404 → 500 so Rapyd can retry. Pending/non-closed → 200, no credits.
- `PAYMENTS_MODE=test` with no provider mode: mock adapter, no HTTP. `RAPYD_MODE=sandbox` or `PAYONEER_MODE=sandbox` without keys does **not** fall through to mock — Buy Credits stays closed. Live Rapyd (`RAPYD_MODE=live`) in test mode is refused. `PAYMENTS_MODE=live` requires `RAPYD_MODE=live` plus access/secret keys and does not fall back to mock. Sandbox credentials are refused in live payments mode. Rapyd is preferred over Payoneer when both sandbox pairs are set.
- Grant idempotency: `purchase:rapyd:{merchant_reference_id}`. Event idempotency: `rapyd` + payment id. Access key and secret key stay in `.dev.vars` / Wrangler secrets (never `NEXT_PUBLIC_*`). Payoneer, PayFast, and Paystack adapters remain unused.
- Money returns are recorded in D1 after staff refund in the **Rapyd Client Portal**. Do not invent a Collect refund HTTP. Payment status becomes `refunded`. Ad Credits are not granted from that action.
- Official [ROUTE_PERMISSION_ERROR](https://docs.rapyd.net/en/troubleshooting-authentication-and-authorization-errors.html) (fetched 2026-08-30): keys authenticate (`GET /v1/data/countries` SUCCESS) but `POST /v1/checkout` is refused when the company is not configured for Collect hosted checkout, or the keys are wrong. Customer copy: card checkout is not enabled; no charge. Do not mention Rapyd, Collect, or Client Support on the billing page. The owner must enable Collect in the Rapyd Client Portal (sandbox) and set the webhook URL to `https://production30.thewellmedia.com/api/webhooks/rapyd` (exact match for signature). Failed checkout logs `[production30:payments]` with HTTP status and `error_code` only.

### 2026-08-28 — Seedance 2 Generator evaluated; filming stays reAPI 2.5

- Evaluated [SamurAIGPT/seedance-2-generator](https://github.com/SamurAIGPT/seedance-2-generator) (local clone `Dev/seedance-2-generator`). It is a Vercel playground: NextAuth, Prisma PostgreSQL, Stripe, MuAPI Seedance **2.0 / Mini**. Its README still marks Seedance 2.5 as coming soon. Browser-pasted MuAPI keys and persisted CDN output URLs are not acceptable here.
- Filming stays the existing contract: model `doubao-seedance-2.5-face`, `Authorization: Bearer $REAPI_API_KEY`, `POST https://reapi.ai/api/v1/videos/generations`, poll `GET /api/v1/tasks/{id}`, 480p / 30s, identity photos + presenter video as signed R2 GET URLs, copy result bytes into private R2. Do not adopt MuAPI, Seedance 2.0, Postgres, or Stripe for this product. Do not copy unsigned MuAPI webhooks. `audio_urls` remains omitted unless a later official-docs pass says otherwise.

### 2026-08-28 — Git push must OpenNext-deploy Worker cineyou

- Official Workers Builds (fetched 2026-08-30): [Configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/), [Build image](https://developers.cloudflare.com/workers/ci-cd/builds/build-image/), [GitHub Actions](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/). Official OpenNext (fetched 2026-08-30): [Develop and deploy](https://opennext.js.org/cloudflare/howtos/dev-deploy) — build `npx @opennextjs/cloudflare build` (repo script `npm run cf:build`). Official versions (fetched 2026-08-30): [Deployment management](https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/) — `wrangler versions upload` does not change routes/queues/cron; `wrangler versions deploy` promotes the version. Local deploy stays `npm run cf:deploy` (`wrangler deploy --containers-rollout none`). GitHub uses `npm run cf:deploy:ci` because `wrangler deploy` re-PUTs queue consumers and the Edit Cloudflare Workers token returns Authentication error [code: 10000]. `.open-next/` is gitignored; `next build` alone then `wrangler deploy` fails because `worker.ts` imports `.open-next/worker.js`. A deploy without `--containers-rollout none` tries to rebuild the branding container image and fails the Worker publish. Dashboard Workers Builds must OpenNext-build plus build vars `NEXT_PUBLIC_APP_URL` and `NEXT_PUBLIC_APP_NAME`. Do not Git-connect this repo as Pages.

### 2026-08-28 — Public origin is production30.thewellmedia.com

- Official Custom Domains (fetched 2026-08-28): [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/). Wrangler `routes` with `custom_domain: true` for `production30.thewellmedia.com`. `workers_dev` stays `true` so `cineyou.schalk-966.workers.dev` is not dropped ([workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/): adding `routes` infers `workers_dev=false` unless set).
- `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` are `https://production30.thewellmedia.com`. Better Auth `trustedOrigins` includes that host and workers.dev. Git push still does not deploy; live updates are `npm run deploy` / Wrangler.

### 2026-08-28 — Error 1102: skip Worker image resizing

- Live `production30.thewellmedia.com` returned Cloudflare **Error 1102** (`Worker exceeded resource limits`, Ray `a32480414d2973fe`). Official meaning: CPU or memory, not a Next 404. Docs: [Error 1102](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1102/), [Workers limits](https://developers.cloudflare.com/workers/platform/limits/) (Free: 10 ms CPU; Paid default 30 s; isolate memory 128 MB; startup 1 s).
- OpenNext on Workers has no Vercel image pipeline. `/_next/image` resizes inside the Worker. Homepage pack webps are already compressed and go out as static files (`images.unoptimized: true`, photographs via `StaticGraphic`). Do not turn the optimizer back on without Cloudflare Image Resizing / Images.

### 2026-08-28 — Signup confirmation (Resend + Better Auth)

- Official Better Auth email (fetched 2026-08-28): [Email](https://better-auth.com/docs/concepts/email). `sendOnSignUp` + `requireEmailVerification` send a confirmation link at signup. Duplicate signup with `requireEmailVerification` returns a generic success and calls `onExistingUserSignUp` instead of “email taken.” A verified existing address must get a sign-in reminder, not another confirm link and not silence. `sendOnSignIn: true` resends confirmation when they try to sign in before confirming. `afterEmailVerification` is the hook for welcome mail. Await the Resend `fetch` on Workers; Better Auth `runInBackgroundOrAwait` swallows send errors, so failures are logged as `[production30:email]`.
- Official Resend send (fetched 2026-08-28): [Send Email](https://resend.com/docs/api-reference/emails/send-email). `409 concurrent_idempotent_requests` means the same send is already in flight — treat as success. Other 409s still fail. From-address stays `Production30 <Accounts@production30.com>`.

### 2026-08-28 — Website to advert reads published page facts only

- Ad Studio “Website to advert” fetches the customer-supplied public `http`/`https` URL server-side and copies `og:title` / `og:description` (or `twitter:` / `<title>` fallbacks). It does not invent an offer, phone, or tagline. Localhost, `.local`, RFC1918, and link-local hosts are refused, including after redirects. If the page cannot be read, the owner types the brief. The existing `getBusinessImporter()` still returns unavailable for onboarding.

## Open questions (do not guess in code)

- None currently.
