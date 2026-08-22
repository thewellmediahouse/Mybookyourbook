# Shop (Shopify headless)

Optional ecommerce for this static Astro template. **Approach B:** branded Astro catalog + cart; Shopify owns products, inventory, and hosted checkout.

Always-on contract: [`AGENT.md`](AGENT.md). Setup details below; component inventory: [`PLATFORM.md`](PLATFORM.md).

## When to enable

- Site sells products (or install-adjacent SKUs) and wants on-site brand through browse/cart
- Willing to use Shopify Admin + Storefront API
- Keep static Cloudflare Pages deploy (no Hydrogen / SSR cart backend)

Disable with `shop: null` (or omit) and `pages.shop: false` — do not leave sample Acme shop copy enabled.

## Architecture

```
Shopify Admin (products / inventory / checkout)
        │ GraphQL Storefront API
        ▼
Build time: loadShopCatalog / getProductByHandle → static /shop, /shop/[handle]
        │ statuses: success | empty | config_missing | request_failed
        │
Cloudflare serves HTML
        │
Browser:
  • LiveStockSync → availability (stock/price on load + tab focus)
  • CartLink / AddToCart / CartPage → cart-client (localStorage cart id; 15s timeout; mutation warnings)
  • Product photos → ShopifyImage (CDN `width` srcset; not Astro assets)
  • Buy now / Secure checkout → allowlisted checkoutUrl → Shopify Checkout
```

- New/removed product **handles** need a **rebuild**
- Stock/price can update live without redeploy
- Payment UI never embeds on this site (PCI stays with Shopify)

## Config map

| Concern | Where |
| -------- | ----- |
| On/off + home teaser | `pages.shop`, `pages.sections.home.shopPreview` |
| Copy / labels / CTAs | `src/config/shop.ts` ← SITE_SPEC `shop` (`emptyCatalog`, `catalogError`, `configMissing`) |
| SEO | `seo.ts` → `pages.shop`, `pages.cart`, `pages.thankYou`; PDPs emit product OG cards + Product JSON-LD |
| Nav + header cart icon | `navigation.ts` (pageKey `shop`); `Header` shows `CartLink` when shop on |
| Credentials | `PUBLIC_SHOPIFY_*` env (preferred) or empty `shopify-public.ts` stubs |
| Optional supply vs add-on pricing | `shop.addonPricing` (null by default) |
| Product share cards | `src/lib/og/product-card.ts` → `/og/products/{handle}.webp` (build-time) |

**Never** put Admin API secrets (`shpat_` / `shpss_`) in config or YAML. Storefront tokens are public-by-design (end up in the browser bundle) but prefer env/CI variables over committing live tokens to the template.

## Env

```bash
PUBLIC_SHOPIFY_STORE_DOMAIN=your-store.myshopify.com
PUBLIC_SHOPIFY_STOREFRONT_TOKEN=…   # Storefront API token (Headless / Storefront channel)
PUBLIC_SHOPIFY_API_VERSION=2025-01  # optional
```

See `.env.example`. Wire the same vars in Cloudflare Pages / Workers Builds for production.

## Shopify Admin checklist

1. Create store; enable **Headless** / Storefront API channel
2. Create a Storefront access token (not Admin)
3. Publish products with handles you are willing to bake into static paths
4. Brand checkout: Admin → Settings → Checkout (logo/colours)
5. Rebuild the site after catalog handle changes

## Site-specific patterns (do not put in platform)

- Install fee schedules, WhatsApp-only flows, reseller “available to order” policy copy beyond config strings
- One-off PDP layouts → `src/components/site/*`
- Optional add-on option naming (e.g. Installation / Supply only) → `shop.addonPricing` in config when needed

## Routes

| Path | Behaviour |
| ---- | --------- |
| `/shop` | Live catalog if configured; else Coming Soon |
| `/shop/[handle]` | PDP with related products, product OG cards, Product JSON-LD; no paths when shop off or unconfigured |
| `/cart` | Client cart → Shopify checkout redirect |

When `pages.shop` is false, shop/cart routes redirect home.

## Agent notes

- Dual gate: `pages.shop` **and** Storefront credentials for a live catalog
- Semantic tokens only (`text-fg*`, `surface-card`, `btn-accent`)
- Client events: `shop:cart-updated`, `shop:variants-updated`, `shop:product-image-updated`
- Dependency: `sanitize-html` for product `descriptionHtml`
- PDPs letterbox Shopify photos into 1200×630 OG cards (do not claim 1200×630 for raw square shots) — see [`go-live.md`](go-live.md) §1.6
- Generated cards live under `public/og/products/` (gitignored; recreated on build)
