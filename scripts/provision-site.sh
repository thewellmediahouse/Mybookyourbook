#!/usr/bin/env bash
# Provision a new private GitHub repo from this template and prepare Wrangler naming.
# Cloudflare Pages Git project + custom domain are checklist-printed (or API if env set).
set -euo pipefail

usage() {
  cat <<'EOF'
Usage: scripts/provision-site.sh --repo <slug> --owner <github-user-or-org> [options]

Options:
  --repo SLUG          Repo / Pages project name (also <slug>.thewellmedia.com)
  --owner OWNER        GitHub user or org that will own the private repo
  --template SRC       Template repo (default: current origin, owner/name)
  --dir PATH           Local clone directory (default: ../<repo> next to this template)
  --collaborator USER  Default: thewellmediahouse
  --permission PERM    Collaborator permission: pull|triage|push|maintain|admin (default: push)
  --push               Create remote, push main, invite collaborator
  --skip-clone         Only print Cloudflare checklist (repo already exists locally)
  -h, --help           Show help

Examples:
  ./scripts/provision-site.sh --repo acme-co --owner my-org
  ./scripts/provision-site.sh --repo acme-co --owner my-org --push
EOF
}

REPO=""
OWNER=""
TEMPLATE=""
TARGET_DIR=""
COLLABORATOR="thewellmediahouse"
PERMISSION="push"
DO_PUSH=0
SKIP_CLONE=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) REPO="${2:-}"; shift 2 ;;
    --owner) OWNER="${2:-}"; shift 2 ;;
    --template) TEMPLATE="${2:-}"; shift 2 ;;
    --dir) TARGET_DIR="${2:-}"; shift 2 ;;
    --collaborator) COLLABORATOR="${2:-}"; shift 2 ;;
    --permission) PERMISSION="${2:-}"; shift 2 ;;
    --push) DO_PUSH=1; shift ;;
    --skip-clone) SKIP_CLONE=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; usage >&2; exit 1 ;;
  esac
done

if [[ -z "$REPO" || -z "$OWNER" ]]; then
  echo "Error: --repo and --owner are required." >&2
  usage >&2
  exit 1
fi

if ! [[ "$REPO" =~ ^[a-z0-9]([a-z0-9-]*[a-z0-9])?$ ]]; then
  echo "Error: --repo must be a lowercase DNS-safe slug (a-z, 0-9, hyphens)." >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATE_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TARGET_DIR="${TARGET_DIR:-$(cd "$TEMPLATE_ROOT/.." && pwd)/$REPO}"

if [[ -z "$TEMPLATE" ]]; then
  if command -v gh >/dev/null 2>&1; then
    TEMPLATE="$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null || true)"
  fi
  if [[ -z "$TEMPLATE" ]]; then
    TEMPLATE="$(git -C "$TEMPLATE_ROOT" remote get-url origin 2>/dev/null | sed -E 's#.*github\.com[:/](.+)(\.git)?$#\1#' | sed 's#\.git$##' || true)"
  fi
fi

if [[ -z "$TEMPLATE" ]]; then
  echo "Error: could not detect template repo; pass --template owner/name." >&2
  exit 1
fi

print_cloudflare_checklist() {
  cat <<EOF

=== Cloudflare Pages checklist (preview) ===
Project name:     $REPO
Custom domain:    https://$REPO.thewellmedia.com
Production branch: main
Non-prod builds:  Disabled
Build command:    npm run build
Output directory: dist
Env (Production):
  PUBLIC_SITE_ENV=preview
  PUBLIC_SITE_URL=https://$REPO.thewellmedia.com
Wrangler name:    wrangler.jsonc "name" → "$REPO"
API token:        Create scoped token; export CLOUDFLARE_API_TOKEN (do not commit)
Git access:       GitHub → Settings → Integrations → Applications → Cloudflare Workers and Pages → add $OWNER/$REPO
                  (docs/DEPLOY.md §4)
Collaborator:     $COLLABORATOR ($PERMISSION) on $OWNER/$REPO

Docs: docs/DEPLOY.md
EOF
}

set_wrangler_name() {
  local file="$1/wrangler.jsonc"
  if [[ ! -f "$file" ]]; then
    echo "Warning: no wrangler.jsonc at $file" >&2
    return 0
  fi
  if command -v node >/dev/null 2>&1; then
    node -e "
const fs = require('fs');
const p = process.argv[1];
const name = process.argv[2];
let s = fs.readFileSync(p, 'utf8');
if (!/\"name\"\\s*:/.test(s)) { console.error('No name field in wrangler.jsonc'); process.exit(1); }
s = s.replace(/(\"name\"\\s*:\\s*\")([^\"]*)(\")/, '\$1' + name + '\$3');
fs.writeFileSync(p, s);
" "$file" "$REPO"
  else
    # portable-ish fallback
    sed -i.bak -E "s/(\"name\"[[:space:]]*:[[:space:]]*\")[^\"]+(\")/\1${REPO}\2/" "$file"
    rm -f "${file}.bak"
  fi
  echo "Updated wrangler.jsonc name → $REPO"
}

if [[ "$SKIP_CLONE" -eq 0 ]]; then
  if [[ -e "$TARGET_DIR" ]]; then
    echo "Error: target already exists: $TARGET_DIR" >&2
    exit 1
  fi

  if ! command -v gh >/dev/null 2>&1; then
    echo "Error: gh (GitHub CLI) is required." >&2
    exit 1
  fi

  echo "Creating private repo $OWNER/$REPO from template $TEMPLATE …"
  # Prefer GitHub template API; fall back to local copy from this checkout.
  if gh repo create "$OWNER/$REPO" --private --template "$TEMPLATE" --clone=false 2>/dev/null; then
    gh repo clone "$OWNER/$REPO" "$TARGET_DIR"
  else
    echo "Template create failed or unsupported; copying local template tree …"
    mkdir -p "$TARGET_DIR"
    # Copy without .git so the new repo is independent
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --exclude .git --exclude node_modules --exclude dist "$TEMPLATE_ROOT/" "$TARGET_DIR/"
    else
      tar -C "$TEMPLATE_ROOT" --exclude .git --exclude node_modules --exclude dist -cf - . | tar -C "$TARGET_DIR" -xf -
    fi
    git -C "$TARGET_DIR" init -b main
    git -C "$TARGET_DIR" add -A
    git -C "$TARGET_DIR" commit -m "Initial commit from astro-business-template"
    gh repo create "$OWNER/$REPO" --private --source="$TARGET_DIR" --remote=origin --push=false
  fi

  set_wrangler_name "$TARGET_DIR"

  if [[ -n "$(git -C "$TARGET_DIR" status --porcelain 2>/dev/null || true)" ]]; then
    git -C "$TARGET_DIR" add wrangler.jsonc
    git -C "$TARGET_DIR" commit -m "Set Wrangler Pages project name to $REPO" || true
  fi

  if [[ "$DO_PUSH" -eq 1 ]]; then
    git -C "$TARGET_DIR" remote get-url origin >/dev/null 2>&1 || \
      git -C "$TARGET_DIR" remote add origin "https://github.com/$OWNER/$REPO.git"
    git -C "$TARGET_DIR" push -u origin HEAD:main
    echo "Inviting @$COLLABORATOR …"
    gh api -X PUT "repos/$OWNER/$REPO/collaborators/$COLLABORATOR" -f permission="$PERMISSION"
  else
    echo "Local repo ready at $TARGET_DIR (not pushed). Re-run with --push when ready."
  fi
else
  if [[ -d "$TARGET_DIR" ]]; then
    set_wrangler_name "$TARGET_DIR"
  fi
fi

print_cloudflare_checklist

if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  cat <<'EOF'

CLOUDFLARE_API_TOKEN is set. You can attempt:
  npx wrangler pages project list
  npx wrangler pages project create <repo>   # shell project; Git link often still needs dashboard
See docs/DEPLOY.md for Git-connected Pages + custom domain.
EOF
fi
