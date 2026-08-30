#!/usr/bin/env bash
# Promote a new Worker version without re-applying queue consumers.
# Official: https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/
# `wrangler deploy` updates queue consumers and exits 1 with Authentication
# error [code: 10000] when the token is Edit Cloudflare Workers (no Queues Edit).
# Existing consumers stay attached to Worker cineyou.

set -euo pipefail

if [ -z "${GITHUB_SHA:-}" ] || [ -z "${GITHUB_RUN_ID:-}" ]; then
  echo "This script is for GitHub Actions. Locally use: npm run cf:deploy" >&2
  exit 1
fi

if [ ! -f .open-next/worker.js ]; then
  echo "OpenNext output is missing (.open-next/worker.js)." >&2
  ls -la .open-next 2>/dev/null || true
  exit 1
fi

tag="gha-${GITHUB_RUN_ID}"

npx wrangler versions upload \
  --tag "$tag" \
  --message "GitHub ${GITHUB_SHA}" \
  --keep-vars \
  --x-auto-create=false

npx wrangler versions deploy --version-tag "${tag}@100%" --yes
