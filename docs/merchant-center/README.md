# Google Merchant Center product feed

Live feed (recommended): **`https://thewellmedia.com/feeds/google-merchant.tsv`**

Generated at build time from `src/config/packages.ts` and `src/config/professionalServices.ts` via `src/utils/merchantFeed.ts`.

Local / preview: `http://localhost:4321/feeds/google-merchant.tsv`

## Connect with scheduled fetch (recommended)

1. Deploy the site so the feed URL is publicly reachable.
2. Open [Google Merchant Center](https://merchants.google.com/).
3. Go to **Settings → Data sources → Add product source**.
4. Choose **A file** (scheduled fetch), not Google Sheets.
5. Paste: `https://thewellmedia.com/feeds/google-merchant.tsv`
6. Set country to **South Africa**, language to **English**.
7. Schedule a daily fetch (or fetch now to test).

When you change package prices or copy in config and redeploy, Merchant Center picks up the update on the next fetch.

Official help: [Create a product data source](https://support.google.com/merchants/answer/14990942)

## Optional: Google Sheets

A static CSV snapshot also lives at [`the-well-media-google-merchant-feed.csv`](./the-well-media-google-merchant-feed.csv) if you prefer Sheets. Prefer the live TSV URL so the site remains the source of truth.

## Before products will approve

Google requires customers to be able to **buy online at the listed price**. For each row:

| Requirement | Action |
| --- | --- |
| Landing page `link` shows the same price | Keep pricing pages accurate, or add dedicated product pages |
| Customer can complete purchase online | Add checkout / payment. Contact-form-only pages are often disapproved |
| `image_link` is HTTPS, ≥ 500×500, product-focused | Replace the temporary OG image in `merchantFeed.ts` with real product images |
| Price format `25000.00 ZAR` | Handled automatically from config |
| No GTIN | `identifier_exists` is `no` |

**Note:** Once-off deliverables (`custom_label_0 = once-off`) usually approve more easily than monthly retainers (`monthly`). You can filter in Merchant Center or later trim the feed generator.

## Feed columns

Required / core: `id`, `title`, `description`, `link`, `image_link`, `availability`, `price`, `brand`, `condition`, `identifier_exists`

Extras: `additional_image_link`, `google_product_category`, `product_type`, `shipping`, `custom_label_0–2`

## Updating products

1. Edit package config in `src/config/`.
2. Redeploy.
3. Wait for the scheduled fetch, or click **Fetch now** in Merchant Center.

Keep each product `id` stable — changing IDs resets performance history.
