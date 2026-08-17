/// <reference types="@cloudflare/workers-types" />

interface Env {
  DESIGN_STUDIO_DB: D1Database;
  DESIGN_STUDIO_ASSETS: R2Bucket;
  ASSETS: Fetcher;
  TURNSTILE_SECRET_KEY?: string;
  OPENAI_API_KEY?: string;
  OPENAI_TEXT_MODEL?: string;
  OPENAI_IMAGE_MODEL?: string;
  PAYFAST_MODE?: string;
  PAYFAST_MERCHANT_ID?: string;
  PAYFAST_MERCHANT_KEY?: string;
  PAYFAST_PASSPHRASE?: string;
  PUBLIC_SITE_URL?: string;
  DESIGN_STUDIO_TEAM_TOKEN?: string;
  DESIGN_STUDIO_NOTIFY_EMAIL?: string;
}

declare namespace Cloudflare {
  interface Env {
    DESIGN_STUDIO_DB: D1Database;
    DESIGN_STUDIO_ASSETS: R2Bucket;
    ASSETS: Fetcher;
    TURNSTILE_SECRET_KEY?: string;
    OPENAI_API_KEY?: string;
    OPENAI_TEXT_MODEL?: string;
    OPENAI_IMAGE_MODEL?: string;
    PAYFAST_MODE?: string;
    PAYFAST_MERCHANT_ID?: string;
    PAYFAST_MERCHANT_KEY?: string;
    PAYFAST_PASSPHRASE?: string;
    PUBLIC_SITE_URL?: string;
    DESIGN_STUDIO_TEAM_TOKEN?: string;
    DESIGN_STUDIO_NOTIFY_EMAIL?: string;
  }
}
