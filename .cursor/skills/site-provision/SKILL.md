---
name: site-provision
description: >-
  Provision a new client site from this Astro business template: private GitHub
  repo, invite thewellmediahouse, Cloudflare Pages preview project at
  <repo>.thewellmedia.com, PUBLIC_SITE_ENV=preview, wrangler project name, API
  token. Use when the user mentions clone template, new site repo, Pages
  preview, thewellmedia.com subdomain, share with Well Media, or site provision.
---

# Site provision (template → private repo → CF Pages preview)

## Read first

1. [`docs/DEPLOY.md`](../../../docs/DEPLOY.md) — full checklist and automation matrix
2. [`docs/AGENT.md`](../../../docs/AGENT.md) — content workflow after infra exists
3. Prefer [`scripts/provision-site.sh`](../../../scripts/provision-site.sh) for GitHub + wrangler rename

## Target state

For repo name `<repo>`:

- Private GitHub repo from template `main`
- Collaborator: [`thewellmediahouse`](https://github.com/thewellmediahouse)
- Cloudflare Pages project name = `<repo>`
- Custom domain: `https://<repo>.thewellmedia.com`
- Production branch: `main`
- Build non-production branches: **Disabled**
- Build env: `PUBLIC_SITE_ENV=preview`, `PUBLIC_SITE_URL=https://<repo>.thewellmedia.com`
- `wrangler.jsonc` `"name"` = `<repo>`
- Operator has a Cloudflare API token for Wrangler (`CLOUDFLARE_API_TOKEN`)

## Agent steps

1. Confirm `<repo>` slug (DNS label + Pages name) and GitHub `--owner`.
2. Run or mirror `scripts/provision-site.sh --repo <repo> --owner <owner> [--push]`.
3. Verify collaborator invite for `thewellmediahouse`.
4. Guide Cloudflare Pages setup (dashboard unless token + Git App already work via API):
   - Connect private repo
   - Project name = `<repo>`
   - Build: `npm run build` → `dist`
   - Branch control: prod `main`, non-prod builds **off**
   - Env vars as above
5. Attach custom domain `<repo>.thewellmedia.com` on the Well Media zone.
6. Remind: create/store API token; never commit secrets.
7. Do **not** invent client content here — hand off to apply-spec / assets prompts.

## Do not

- Put client sites on template `main` or add more client branches (except existing `wellmedia`)
- Commit `CLOUDFLARE_API_TOKEN` or `.env` with secrets
- Enable non-prod branch builds for these preview projects unless asked
- Skip renaming `wrangler.jsonc` `"name"`

## Automation honesty

Fully auto from this repo: GitHub create/clone, invite, wrangler rename, push.  
Cloudflare Git-linked Pages + domain: needs account GitHub App + API token; otherwise print the dashboard checklist from `docs/DEPLOY.md`.
