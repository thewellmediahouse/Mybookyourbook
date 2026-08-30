#!/usr/bin/env bash
# Promote a new Worker version without re-applying queue consumers.
# Official: https://developers.cloudflare.com/workers/versions-and-deployments/deployment-management/
# `wrangler deploy` updates queue consumers and exits 1 with Authentication
# error [code: 10000] when the token is Edit Cloudflare Workers (no Queues Edit).
# Existing consumers stay attached to Worker cineyou.

set -euo pipefail

# Official Workers Builds injects WORKERS_CI, WORKERS_CI_COMMIT_SHA,
# WORKERS_CI_BUILD_UUID: https://developers.cloudflare.com/workers/ci-cd/builds/configuration/#environment-variables
sha="${GITHUB_SHA:-${WORKERS_CI_COMMIT_SHA:-}}"
if [ -n "${WORKERS_CI:-}" ] && [ -n "${WORKERS_CI_BUILD_UUID:-}" ]; then
  tag="cfb-${WORKERS_CI_BUILD_UUID}"
  message="Workers Builds ${sha}"
elif [ -n "${GITHUB_SHA:-}" ] && [ -n "${GITHUB_RUN_ID:-}" ]; then
  tag="gha-${GITHUB_RUN_ID}"
  message="GitHub ${GITHUB_SHA}"
else
  echo "This script is for GitHub Actions or Workers Builds. Locally use: npm run cf:deploy" >&2
  exit 1
fi

if [ -z "$sha" ]; then
  echo "Missing commit SHA (GITHUB_SHA or WORKERS_CI_COMMIT_SHA)." >&2
  exit 1
fi

if [ ! -f .open-next/worker.js ]; then
  echo "OpenNext output is missing (.open-next/worker.js)." >&2
  ls -la .open-next 2>/dev/null || true
  exit 1
fi

npx wrangler versions upload \
  --tag "$tag" \
  --message "$message" \
  --keep-vars \
  --x-auto-create=false

npx wrangler versions deploy --version-tag "${tag}@100%" --yes
