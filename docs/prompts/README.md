# Prompt pack

## ChatGPT (content person — external)

Upload to a ChatGPT Project (or attach each run):

1. [`../AGENT.md`](../AGENT.md)
2. [`../SITE_SPEC.schema.json`](../SITE_SPEC.schema.json)
3. [`../SITE_SPEC.example.yaml`](../SITE_SPEC.example.yaml)
4. [`01-fill-spec.md`](01-fill-spec.md) — use as custom instructions / first message

Paste company context using the user template inside `01-fill-spec.md`.

**Deliverables:** `SITE_SPEC.yaml` + images named per `assets[]`.

Do **not** upload `PLATFORM.md`, `_legacy/*`, or `src/`.

## Cursor (developer)

| Prompt / skill | When |
| -------------- | ---- |
| [`../DEPLOY.md`](../DEPLOY.md) + skill `site-provision` | New private repo, invite Well Media, Pages preview at `<repo>.thewellmedia.com` |
| [`02-apply-spec.md`](02-apply-spec.md) | Apply YAML → `src/config/*` |
| [`03-assets.md`](03-assets.md) | Place / wire images |
| [`04-lighthouse.md`](04-lighthouse.md) | Fix Lighthouse to ≥90 / target 100 |
