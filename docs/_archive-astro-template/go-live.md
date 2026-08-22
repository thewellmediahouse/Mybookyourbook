# Go-live checklist (Cloudflare Pages / Workers assets + Astro static)

Reusable reference for launching a static Astro site from this template on **Cloudflare Pages** (or Workers static assets via Wrangler) with a custom domain. Replace placeholders with the project’s values.

Preview provision (Well Media staging host) is covered in [`DEPLOY.md`](DEPLOY.md). Use this checklist for **production cutover** and SEO/Open Graph readiness.

**Placeholders**

| Token | Example |
|---|---|
| `{SITE_URL}` | `https://example.com` |
| `{WWW_HOST}` | `www.example.com` |
| `{STAGING_URL}` | `https://acme.thewellmedia.com` |
| `{PROJECT_NAME}` | Pages / Wrangler project name (often the repo name) |
| `{PRODUCTION_BRANCH}` | `main` |

---

## 0. Goals before DNS cutover

Finish code/SEO readiness **before** pointing the production hostname at the site. Staging may stay noindex (`PUBLIC_SITE_ENV=preview`); production must allow indexing once the live domain is attached.

---

## 1. Code & SEO readiness (before domain)

### 1.1 Canonical URL config

- [ ] `site.url` in `src/config/site.ts` = `{SITE_URL}` (https, no trailing path)
- [ ] `astro.config` `site:` matches that same origin (`PUBLIC_SITE_URL` or `siteConfig.url`)
- [ ] Form success `_next` / redirects use production origin outside local dev (not the staging host)

### 1.2 Trailing-slash policy

Pick one policy and align **canonicals, sitemap, nav, CTAs, and form redirects**.

- [ ] Prefer `trailingSlash: 'always'` for Astro static + `page/index.html` on Cloudflare assets
- [ ] SEO / nav paths use `/about/`, `/shop/`, … (home stays `/`)
- [ ] Internal links and shop product hrefs include the trailing slash
- [ ] Build check: page canonical **equals** sitemap `<loc>` for the same page

### 1.3 Indexing vs preview

Build-time detection (`PUBLIC_SITE_ENV`) should control:

| Context | Indexing | Sitemap | `robots.txt` |
|---|---|---|---|
| Production / unset / `PUBLIC_SITE_ENV=production` | Allow | Generate | `Allow: /` + sitemap URL |
| Preview / staging (`PUBLIC_SITE_ENV=preview`) | Block | Prefer omit or still noindex | `Disallow: /` |
| Local build | Usually allow (or force preview via env) | — | — |

- [ ] Preview pages emit `<meta name="robots" content="noindex, nofollow">`
- [ ] Preview builds merge `X-Robots-Tag: noindex, nofollow` into `dist/_headers` without dropping security/cache rules
- [ ] Canonicals always point at `{SITE_URL}` even on staging hosts (avoid duplicate “primary” URLs), **or** intentionally use `{STAGING_URL}` only while staging is the public host

### 1.4 Cart / utility routes (if shop)

- [ ] Cart (and similar non-landing utilities) set `noindex`
- [ ] Sitemap **filter** excludes `/cart` and `/thank-you` (and 404 if it would appear)
- [ ] Build check: sitemap has **no** `/cart/` or `/thank-you/` entry; those pages have `noindex`

### 1.4.1 Analytics (optional)

- [ ] Production GA4 / Meta Pixel IDs in `src/config/analytics.ts` (leave `''` to disable)
- [ ] Confirm tags do **not** load on preview (`PUBLIC_SITE_ENV=preview`) or local `astro dev`

### 1.5 Page SEO coverage

- [ ] Main marketing pages use shared SEO config (title, description)
- [ ] Layout emits: title, description, canonical, Open Graph, Twitter card, favicons
- [ ] Organization / LocalBusiness JSON-LD on site layout when data exists
- [ ] 404 is `noindex`

### 1.5.1 Default (home / non-product) Open Graph image

Do **not** ship a generic stock illustration or decorative SVG-as-raster as the sitewide `og:image`. Share previews should read as **this brand** at a glance.

- [ ] Default OG asset is a real branded photo or promo frame (logo/uniform, location or service message visible)
- [ ] Prefer a raster in `src/assets/` → `raster.og.default` (Astro `getImage` cover crop to **1200×630**) with accurate width/height meta — not a leftover `public/og-default.svg` placeholder
- [ ] Meaningful `og:image:alt` (not only the short site name)
- [ ] Visual check after build: open the hashed `/_astro/…webp` referenced by home `og:image`
- [ ] Product PDPs may override with product cards (see 1.6); everything else falls back to this default

**“Missing conversion text” / CTA on the image**

Some checkers (OCR) flag OG images that lack a button-like call-to-action. Treat as guidance, not a hard fail:

- A strong branded promo frame with clear on-image copy is usually enough — checkers may miss stylized text and expect a literal CTA button look.
- If you truly need stronger conversion art later, options are: (1) design a dedicated 1200×630 asset in Figma/Canva with photo + short CTA, (2) Sharp composite at build time (logo + 1–2 lines on a cover crop), (3) reuse an existing campaign frame that already has CTA baked in.
- Do **not** chase the warning if humans can read brand + offer on the card and the image already loads correctly.

### 1.5.2 SEO title vs share-card title (good trade-off)

Keep a **longer keyword-rich `<title>`** (and meta description) for search / bookmarks when useful. Google’s SERP display is a soft ~60-character truncate, but a slightly longer title can still help SEO.

Use dedicated **`ogTitle` / `ogDescription`** (and matching Twitter tags) for share cards so WhatsApp / LinkedIn / X don’t look crowded:

| Field | Target | Role |
|---|---|---|
| `<title>` / meta `description` | Can be longer | SEO, browser tab |
| `og:title` / `twitter:title` | ~40–60 characters | Share card |
| `og:description` / `twitter:description` | ~120–150 characters | Share card |

Splitting them is the right pattern. Do **not** shrink the SEO `<title>` only to silence a share-preview tool.

- [ ] Marketing pages set explicit `ogTitle` / `ogDescription` in `seo.ts` when share cards need shorter copy
- [ ] Layout falls back to a soft clip when overrides are missing (e.g. dynamic PDPs)
- [ ] **`twitter:site` only if the brand has an X account** — never invent `@yourbrand`. Leave `twitterHandle` empty when there is no handle (checkers may recommend it; ignore if N/A)

### 1.6 Product / shop SEO (if ecommerce)

Do **not** use raw square product shots as `og:image` while claiming 1200×630 — platforms crop oddly.

- [ ] Build-time **1200×630** share cards (letterbox product on brand background; trim empty studio margins)
- [ ] PDP: `og:type=product`, correct `og:image` (+ width/height/type), price meta if used
- [ ] Product JSON-LD (`Product` + `Offer`: price, currency, availability, image URLs)
- [ ] OG files deploy under a stable public path (e.g. `/og/products/{handle}.webp`)
- [ ] Fallback to site default OG if card generation fails (don’t break the build)

**Visual check (local):** after `npm run build`, open `dist/og/products/*.webp`.

### 1.7 Optional schema polish (only if data exists)

- [ ] `openingHours` / `openingHoursSpecification` — only if accurate
- [ ] `geo` lat/lng — **only** if coordinates are known (address alone is not enough)
- [ ] `sameAs` — only if real social profile URLs exist

### 1.8 Staging smoke (before DNS)

On `{STAGING_URL}`:

- [ ] Site loads; shop/PDPs load if applicable
- [ ] Preview is **noindex** (`robots` meta and/or `robots.txt` `Disallow: /`)
- [ ] Cart is `noindex` (if shop)
- [ ] Product OG **files** return 200 on the staging host (even if `og:image` meta points at `{SITE_URL}`)
- [ ] Note: social debuggers follow absolute `og:image` → they won’t resolve until `{SITE_URL}` is live

### 1.9 Commit / deploy

- [ ] SEO fixes merged to `{PRODUCTION_BRANCH}`
- [ ] Pages / Workers build completed successfully for that commit

---

## 2. Cloudflare production build settings

In **Workers & Pages → `{PROJECT_NAME}` → Settings**:

| Setting | Typical value |
|---|---|
| Build command | `npm run build` |
| Deploy | Git-connected Pages, or `npx wrangler deploy` / `npm run deploy` |
| Output | `./dist` (`wrangler.jsonc` `assets.directory`) |
| Production branch | `{PRODUCTION_BRANCH}` |

- [ ] Production branch = `{PRODUCTION_BRANCH}`
- [ ] Build vars: `PUBLIC_SITE_ENV` unset or `production` on production; preview uses `PUBLIC_SITE_ENV=preview`
- [ ] Shopify/storefront (or other) secrets present if the build fetches remote catalog data
- [ ] Avoid double-deploy (Pages Git builds **and** a separate Wrangler/GitHub Action) unless intentional

---

## 3. DNS & custom domain (last infrastructure step)

### 3.1 Attach production hostname

- [ ] Apex `{SITE_URL}` host attached (Pages custom domain or Worker Custom Domain)
- [ ] HTTPS certificate issued / active
- [ ] Apex serves the site (`curl -sI {SITE_URL}` → `200`)

### 3.2 `www` → apex redirect

Custom domains match **exact** hostnames. Apex does **not** automatically receive `www`. Use a [Redirect Rule](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/):

1. **DNS:** Proxied record for `www` (orange cloud). Originless placeholder is fine if www only redirects: `A` → `192.0.2.0` or `AAAA` → `100::`.
2. **Rules → Redirect Rules** (301):
   - Wildcard: `https://www.example.com/*` → `https://example.com/${1}` + preserve query string
   - Or: hostname equals `{WWW_HOST}` → dynamic redirect to apex
3. If Cloudflare warns “may not be proxying www”:
   - If `www` is **already** proxied → choose **Ignore and deploy rule anyway**
   - Do **not** create a duplicate DNS record

- [ ] `curl -sI https://{WWW_HOST}/` → `301` → `{SITE_URL}/`
- [ ] Prefer **not** attaching `www` as a second custom domain if the goal is redirect-only SEO

### 3.3 Always Use HTTPS

- [ ] **SSL/TLS → Edge Certificates → Always Use HTTPS → On**
- [ ] Generic “origin redirect loop” warning is usually safe to ignore when origin is Cloudflare Pages / a Worker
- [ ] Verify: `curl -sI http://example.com/` → `301` → `https://example.com/`

Expected chain for `http://www…/path`:

1. HTTP → HTTPS on www (Always Use HTTPS)
2. HTTPS www → HTTPS apex (Redirect Rule, 301)
3. Apex `200`

Two hops for http+www is normal; direct https apex is one request.

### 3.4 Optional DNS tidy

- [ ] Replace old `www` A/AAAA pointing at a legacy origin IP with originless proxied placeholders (www only redirects)
- [ ] Confirm mail (`MX`/`TXT`/`DKIM`/`SPF`) untouched

---

## 4. Production smoke checklist (after DNS)

Run against `{SITE_URL}`:

### 4.1 Core HTTP

```bash
BASE='https://example.com'   # {SITE_URL}
curl -sI "$BASE/"
curl -sI "http://example.com/"                    # → https
curl -sI "https://www.example.com/"               # → https apex
curl -sI -L --max-redirs 5 "http://www.example.com/shop/"
```

- [ ] Apex https `200`
- [ ] http apex → https apex
- [ ] https www → https apex (301)
- [ ] No redirect loop (`ERR_TOO_MANY_REDIRECTS`)

### 4.2 Indexing artifacts

```bash
curl -sL "$BASE/robots.txt"
curl -sL "$BASE/sitemap-index.xml"
curl -sL "$BASE/sitemap-0.xml"
```

- [ ] `robots.txt` includes `Allow: /` and `Sitemap: {SITE_URL}/sitemap-index.xml` (Cloudflare may prepend managed AI bot blocks — OK)
- [ ] Sitemap XML exists (not the HTML 404 page)
- [ ] Sitemap lists marketing + product URLs as expected
- [ ] Sitemap does **not** include `/cart/` (if shop)
- [ ] Home/PDP: **no** `noindex` meta; cart: **has** `noindex` (if shop)

### 4.3 Default + product OG

```bash
# Home / marketing default
curl -sL "$BASE/" | rg -o 'og:image" content="[^"]+"'
# expect branded asset URL (not a leftover generic illustration), 1200×630

# PDP (if shop)
curl -sI "$BASE/og/products/{handle}.webp"
# expect: 200, image/webp, 1200×630
```

- [ ] Home `og:image` absolute URL on `{SITE_URL}` returns 200 and looks branded
- [ ] Product OG files 200 on production (if shop)
- [ ] Dimensions 1200×630
- [ ] `Product` JSON-LD present with offer price/availability (PDPs)

### 4.4 Social preview caches & checkers

**Before pasting a link into WhatsApp** (or after any OG change), run a live Open Graph checker on the public URL:

1. Confirm deploy is live (`curl` / view-source shows the new `og:image` / titles)
2. Analyze with [Open Graph Checker](https://opengraphchecker.com/#analyzer) or [opengraph.xyz](https://www.opengraph.xyz/)
3. Then paste into WhatsApp — use `{SITE_URL}/?og=2` (or similar) if an old card is cached

Platforms cache link previews aggressively. **Live HTML can be correct while chat apps still show the old image.**

| Platform | How to refresh |
|---|---|
| [Open Graph Checker](https://opengraphchecker.com/#analyzer) | Paste URL; review tags, image, and platform scores **before** WhatsApp |
| [opengraph.xyz](https://www.opengraph.xyz/) | Alternate preview / meta check |
| Facebook Sharing Debugger | Paste URL → **Scrape Again** |
| LinkedIn Post Inspector | Paste URL → inspect |
| **WhatsApp** | No public debugger. Paste a **new** URL WhatsApp hasn’t cached, e.g. `{SITE_URL}/?og=2`. Bare `{SITE_URL}/` can keep the old thumbnail for a long time in existing chats. |

- [ ] Run Open Graph Checker (or equivalent) on home + one PDP before sharing in WhatsApp
- [ ] Confirm live `og:image` with `curl` / view-source **before** blaming the deploy
- [ ] Re-test WhatsApp with a cache-bust query (`?og=2` or similar) after changing the default OG
- [ ] After OG changes, scrape Facebook/LinkedIn; don’t rely on an old WhatsApp thread
- [ ] Soft recommendations like missing `twitter:site` are OK when the brand has no X account
- [ ] Soft “OG image missing CTA / conversion text” is OK when the card already shows clear brand + offer copy (OCR often wants a button-like look)

### 4.5 Google Search Console

Prefer a **Google account the business controls** (e.g. Workspace / `hello@{domain}`), not only a personal or agency-only login.

- [ ] Add a **Domain** property for the bare domain (covers apex + `www`) — verify with **DNS TXT** in Cloudflare
- [ ] Or add the client as **Owner** if an agency verifies first
- [ ] Submit sitemap: `{SITE_URL}/sitemap-index.xml`
- [ ] Optional: Bing Webmaster Tools

Verification does **not** require an `@domain` Google login (DNS TXT works from any account), but **ownership should end with the business**.

---

## 5. Staging vs production quick contrast

| Check | Staging | Production |
|---|---|---|
| `robots` meta | `noindex, nofollow` | Absent on public pages |
| `robots.txt` | `Disallow: /` | `Allow: /` + sitemap |
| Sitemap | Missing / 404 or still noindex site | Present |
| `X-Robots-Tag` | Often `noindex` sitewide | Absent on public HTML |
| Cart | `noindex` | `noindex` |
| `og:image` host | Meta may still say `{SITE_URL}` | `{SITE_URL}` resolves |

---

## 6. Common pitfalls

1. **Canonical ≠ sitemap** (trailing slash mismatch) — fix policy before go-live.
2. **Cart in sitemap** — filter + `noindex`.
3. **Square product photo as OG with fake 1200×630 meta** — letterbox real 1200×630 cards.
4. **Generic illustration as default site OG** — shares look unbranded; use a real promo/hero frame.
5. **`og:image` points at production while only staging is live** — scrapers fail until DNS is linked.
6. **WhatsApp / chat still shows old OG** — live meta is fine; platform cache. Bust with `?og=2` or wait; run [Open Graph Checker](https://opengraphchecker.com/#analyzer) before sharing.
7. **Adding fake `twitter:site`** — only set when a real `@handle` exists.
8. **Chasing “OG image missing CTA”** when the promo frame already has readable offer text — optional redesign only if humans agree the card is weak.
9. **Shrinking SEO `<title>` only for a share checker** — keep long SEO titles; use separate `ogTitle` instead.
10. **Preview build promoted without clearing `PUBLIC_SITE_ENV=preview`** — live site stays `Disallow: /`.
11. **www “coming soon”** — missing redirect rule or www not proxied.
12. **Duplicate www DNS** when dismissing Cloudflare’s proxy warning.
13. **Always Use HTTPS + old origin that also forces HTTPS on Flexible SSL** — can loop; Pages / Worker custom domain setups are usually fine.
14. **Both Pages Git builds and Wrangler/GitHub Actions deploying** — race / surprise rollbacks.
15. **Search Console only on an agency personal Gmail** — transfer Owner to the business before handoff.

---

## 7. Minimal “ship today” gate

Ready to call live when **all** are true:

- [ ] Production build is indexable (`Allow: /` + sitemap)
- [ ] Apex https serves the site
- [ ] www → apex 301
- [ ] Always Use HTTPS on
- [ ] Cart noindex + absent from sitemap (if shop)
- [ ] Trailing slash consistent (canonical = sitemap)
- [ ] Default home OG is branded 1200×630 (not a leftover generic art asset)
- [ ] Product OG files 200 on production (if shop)
- [ ] Spot-check with [Open Graph Checker](https://opengraphchecker.com/#analyzer) (or opengraph.xyz) **before** WhatsApp; use `?og=2` if WhatsApp cache sticks
- [ ] Search Console Domain property verified (business-owned) and sitemap submitted or queued

---

## 8. Porting notes

1. Keep sections 1–7; swap placeholders in the table at the top.
2. Drop shop/OG subsections if the site has no storefront; **keep** default branded OG (1.5.1) and social-cache notes (4.4).
3. Keep trailing-slash + preview-noindex + cart filter as default Astro/Cloudflare guidance.
4. Link Cloudflare docs rather than duplicating UI labels that change:
   - [Pages custom domains](https://developers.cloudflare.com/pages/configuration/custom-domains/)
   - [Workers custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)
   - [Redirect www to root](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/)
5. Store project-specific DNS dumps separately (e.g. `docs/dns/`) — not in this checklist.
6. Document the site’s chosen default OG asset (`raster.og.default` or path) so the next launch doesn’t regress to placeholder art.

---

## Related

- [`DEPLOY.md`](DEPLOY.md) — preview provision (`PUBLIC_SITE_ENV=preview`)
- [`PLATFORM.md`](PLATFORM.md) — SEO / a11y / Lighthouse
- [`SHOP.md`](SHOP.md) — optional Shopify headless
- [`AGENT.md`](AGENT.md) — agent contract
