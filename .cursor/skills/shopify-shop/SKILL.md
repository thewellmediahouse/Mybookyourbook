---
name: shopify-shop
description: >-
  Enable or configure the optional Shopify headless shop on this Astro business
  template (Approach B: static catalog + Storefront cart + Shopify checkout).
  Use when the user mentions shop, Shopify, storefront, cart, products catalog,
  /shop, or ecommerce for a site built from this template.
---

# Shopify shop (template)

## Read first

1. `docs/SHOP.md` — architecture and env
2. `docs/AGENT.md` — hard constraints (static only; config-first)
3. `src/config/shop.ts` + `pages.ts` — current toggles/copy

## Enable a shop

1. Set SITE_SPEC `shop` object (not null) with preview/live/comingSoon/cart/product copy
2. `pages.shop: true`; optionally `pages.sections.home.shopPreview: true`
3. Apply → `src/config/shop.ts`, `pages.ts`, `seo.ts` (shop + cart), nav already filters by `pageKey: 'shop'`
4. Set Cloudflare/local env: `PUBLIC_SHOPIFY_STORE_DOMAIN`, `PUBLIC_SHOPIFY_STOREFRONT_TOKEN`
5. Leave `shopify-public.ts` empty unless the site intentionally commits public Storefront defaults
6. `npm run check && npm run build`

## Disable

- `shop: null` + `pages.shop: false` + `shopPreview: false`
- Clear or ignore sample Acme shop copy

## Do not

- Add React, Hydrogen, SSR, or Admin API calls for the storefront path
- Put Admin secrets in YAML/config
- Hardcode client product names, install fee tables, or WhatsApp URLs in `src/components/shop/*`
- Use Cool Guy–specific install option names unless configuring `shop.addonPricing`

## Optional add-on pricing

When a Shopify option pairs a base price with an add-on (e.g. Installation):

```yaml
addonPricing:
  optionName: Installation
  baseValue: Supply only
  note: "…"
  breakdownLabels:
    unit: Unit
    addon: Standard install
```

Otherwise keep `addonPricing: null`.
