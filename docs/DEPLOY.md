# Site provision & Cloudflare Pages (Well Media)

Canonical runbook for spinning a **new client site** from this template into a private GitHub repo, handing it to [thewellmediahouse](https://github.com/thewellmediahouse), and attaching a **preview** Cloudflare Pages project at `https://<repo>.thewellmedia.com`.

Agent entrypoint: [`.cursor/skills/site-provision/SKILL.md`](../.cursor/skills/site-provision/SKILL.md). Partial automation: [`scripts/provision-site.sh`](../scripts/provision-site.sh).

Content/build work after provision remains: [`AGENT.md`](AGENT.md) → apply spec → assets → Lighthouse.

---

## Outcomes

| Item | Value |
| ---- | ----- |
| GitHub | New **private** repo cloned from this template (`main`) |
| Collaborator | Invite **`thewellmediahouse`** (Write or Admin) |
| Cloudflare | Pages project named **same as the repo** |
| Custom domain | `<repo>.thewellmedia.com` (zone: `thewellmedia.com`) |
| Production branch | `main` |
| Non-production branch builds | **Disabled** |
| Build env | `PUBLIC_SITE_ENV=preview` (and usually `PUBLIC_SITE_URL=https://<repo>.thewellmedia.com`) |
| Wrangler | `wrangler.jsonc` `"name"` = Pages project / repo name |
| API token | Scoped Cloudflare token for Wrangler / CI deploy to that account |

Preview here means the **Well Media staging host** for the site, not Cloudflare’s automatic PR preview URLs. With non-prod branch builds disabled, only `main` builds.

---

## Prerequisites (one-time per operator)

1. **GitHub CLI** (`gh`) authenticated as a user who can create private repos under the target org/user.
2. **Cloudflare** access to the Well Media account that owns DNS for `thewellmedia.com`.
3. **GitHub ↔ Cloudflare** connected for private repos (install **Cloudflare Workers and Pages** on the user/org that owns site repos; for each new private repo, add it under GitHub **Settings → Integrations → Applications** — see [§4](#4-give-cloudflare-pages-access-to-the-repo)).
4. Ability to create Cloudflare **API tokens** (Account → Manage account → API tokens).

Optional for CLI automation: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, and `wrangler` logged in (`npx wrangler whoami`).

---

## Checklist (full process)

### 1. Clone template → private GitHub repo

```bash
# From a sibling directory of this template (or use scripts/provision-site.sh)
REPO="<repo>"   # e.g. acme-plumbing — becomes Pages name + subdomain label
OWNER="<github-user-or-org>"

gh repo create "$OWNER/$REPO" --private --template "<template-owner>/astro-business-template" \
  --description "Client site — Well Media preview"
# If --template is unavailable for this source, use:
#   git clone --depth 1 <template-url> "$REPO" && cd "$REPO" && rm -rf .git
#   git init && git add -A && git commit -m "Initial commit from astro-business-template"
#   gh repo create "$OWNER/$REPO" --private --source=. --remote=origin --push
```

Prefer a clean `main` from template `main` only (not the `wellmedia` branch).

### 2. Rename Wrangler project

In the new repo, set `wrangler.jsonc` `"name"` to **`$REPO`** (must match the Cloudflare Pages project name).

```jsonc
{
  "name": "<repo>",
  "compatibility_date": "2026-07-04",
  "assets": {
    "directory": "./dist",
    "not_found_handling": "404-page"
  }
}
```

Commit and push to `main`.

### 3. Share repo with Well Media

```bash
gh api -X PUT "repos/$OWNER/$REPO/collaborators/thewellmediahouse" \
  -f permission=push
# or: Admin if they must manage settings / Pages tokens
```

Confirm the invite is accepted at [github.com/thewellmediahouse](https://github.com/thewellmediahouse).

### 4. Give Cloudflare Pages access to the repo

Cloudflare deploys from Git via the **Cloudflare Workers and Pages** GitHub App. New private repos are often missing from that app until you add them.

**Add `$REPO` on GitHub (usual path when the app is already installed):**

1. GitHub → profile (top right) → **Settings**
2. Left sidebar → **Integrations** → **Applications** (URL: [github.com/settings/installations](https://github.com/settings/installations))
3. Under **Installed GitHub Apps**, find **Cloudflare Workers and Pages** → **Configure**
4. **Repository access** → **Only select repositories** → add `$REPO` (e.g. `nexus-ebikes`) → **Save**

For an **organization** owner: org **Settings** → **Integrations** → GitHub App installations (or `https://github.com/organizations/<ORG>/settings/installations`).

**If the app is not installed yet:** Cloudflare dashboard → Workers & Pages → Create → Pages → Connect to Git → **+ Add account** → Install & Authorize on the GitHub user/org that owns the site repos, then select `$REPO`.

After access is granted, `$REPO` should appear in the Cloudflare “Import repository” list.

### 5. Create the Pages **preview** project

**Dashboard (reliable):**

1. Workers & Pages → Create → Pages → Import Git repository → select `$REPO`.
2. **Project name:** `$REPO` (must match `wrangler.jsonc`).
3. **Production branch:** `main`.
4. **Build command:** `npm run build`
5. **Build output directory:** `dist`
6. Framework preset: none / Astro as appropriate; Node from `.nvmrc` if set.
7. **Builds → Branch control:** production = `main`; **Build non-production branches: Disabled**.
8. **Environment variables** (Production — and Preview if you ever re-enable branch builds):

| Variable | Value |
| -------- | ----- |
| `PUBLIC_SITE_ENV` | `preview` |
| `PUBLIC_SITE_URL` | `https://<repo>.thewellmedia.com` |
| (+ form/shop vars as needed) | see `.env.example` |

9. Save and deploy.

**CLI notes:** `npx wrangler pages project create <repo>` creates a project shell (often for direct upload). **Git-connected** projects with branch controls are still best created/verified in the dashboard (or via Cloudflare Pages API with a `source` GitHub config). After the project exists, Wrangler deploy works when `"name"` matches:

```bash
npm run build && npx wrangler pages deploy dist --project-name="<repo>"
# or: npm run deploy  (uses wrangler.jsonc assets → wrangler deploy)
```

### 6. Custom domain `<repo>.thewellmedia.com`

1. Pages project → Custom domains → Set up a domain → `<repo>.thewellmedia.com`.
2. If `thewellmedia.com` is on the same Cloudflare account, DNS is usually auto-provisioned (CNAME to the Pages project).
3. Wait for Active; open `https://<repo>.thewellmedia.com` and confirm the latest `main` deploy.

### 7. New API token + Wrangler

Create a Cloudflare API token scoped to this account (minimum useful set):

- Account → Cloudflare Pages → Edit (or Workers Scripts Edit if using Workers assets deploy)
- Zone → DNS Edit (only if the token must manage `thewellmedia.com` records)
- Include the Well Media account (and zone if needed)

Store the token in the operator password manager / CI secrets as `CLOUDFLARE_API_TOKEN`. Do **not** commit it.

Verify:

```bash
export CLOUDFLARE_API_TOKEN=…
export CLOUDFLARE_ACCOUNT_ID=…   # optional if wrangler.toml/account_id set
npx wrangler whoami
npx wrangler pages project list
```

Confirm `wrangler.jsonc` `"name"` equals the Pages project name before relying on `npm run deploy`.

---

## What `PUBLIC_SITE_ENV=preview` does

| Value | Behavior |
| ----- | -------- |
| `preview` | Site is treated as staging: `noindex,nofollow` via layout SEO; `robots.txt` disallows all; sitemap integration omitted; preview `X-Robots-Tag` is **merged** into existing `public/_headers` (never overwrites security/cache rules) |
| unset / `production` | Normal indexing (unless a page sets `noindex`); sitemap generated with `/cart/` and `/thank-you/` filtered out |

Always pair preview Pages builds with `PUBLIC_SITE_URL=https://<repo>.thewellmedia.com` so canonicals/sitemap match the staging host.

---

## Automation: what this repo can do

| Step | Automatable? | How |
| ---- | ------------ | --- |
| Create private repo from template | **Yes** | `gh repo create` / `scripts/provision-site.sh` |
| Invite `thewellmediahouse` | **Yes** | `gh api …/collaborators/thewellmediahouse` |
| Rename `wrangler.jsonc` + push | **Yes** | script / agent |
| Grant CF GitHub App access to repo | **Partial** | App install is one-time; per-repo “selected repos” may need dashboard |
| Create Git-linked Pages project + branch controls | **Partial** | Dashboard recommended; API possible with token + GitHub installation id |
| Set build env vars | **Yes** (API/dashboard) | Pages project settings or Cloudflare API |
| Custom domain on `thewellmedia.com` | **Yes** (API/dashboard) | Needs zone on same CF account |
| Mint API token | **No** (interactive) | Dashboard once; then reuse via env |
| Content fill / Lighthouse | Separate | `docs/prompts/*` |

**Bottom line:** GitHub + wrangler rename + collaborator invite are scriptable from this repo today. End-to-end Cloudflare Git Pages + DNS is scriptable **only after** account-level GitHub App + `CLOUDFLARE_API_TOKEN` / account id are available; otherwise the script stops at a printed Cloudflare checklist.

Run local helper:

```bash
./scripts/provision-site.sh --repo <repo> --owner <github-org-or-user>
# Add --push after reviewing the new repo locally
```

---

## Production cutover (later)

When the client’s real domain goes live:

1. New or second Pages project (or same project) with `PUBLIC_SITE_ENV` unset or `production`.
2. Set `PUBLIC_SITE_URL` + `site.ts` `url` to the production domain.
3. Attach the client domain; keep or retire `<repo>.thewellmedia.com` as needed.
4. Run the full production smoke + Open Graph checks in [`go-live.md`](go-live.md).

---

## Related

- [`go-live.md`](go-live.md) — production DNS, indexing, Open Graph, Search Console checklist
- [`PLATFORM.md`](PLATFORM.md) — npm 10 / Pages lockfile rules
- [`SHOP.md`](SHOP.md) — optional Storefront env on Pages
- [`.env.example`](../.env.example) — public env vars
- [Cloudflare Pages branch builds](https://developers.cloudflare.com/pages/configuration/branch-build-controls/)
- [Wrangler Pages commands](https://developers.cloudflare.com/workers/wrangler/commands/pages/)
