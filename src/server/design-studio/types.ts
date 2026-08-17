export interface DesignStudioEnv {
  DESIGN_STUDIO_DB: D1Database;
  DESIGN_STUDIO_ASSETS?: R2Bucket;
  ASSETS: Fetcher;
  /** Cloudflare Turnstile secret — never expose to the browser */
  TURNSTILE_SECRET_KEY?: string;
  /** OpenAI — server only */
  OPENAI_API_KEY?: string;
  OPENAI_TEXT_MODEL?: string;
  OPENAI_IMAGE_MODEL?: string;
  /** PayFast — server only. Set PAYFAST_MODE=live for production payments. */
  PAYFAST_MODE?: string;
  PAYFAST_MERCHANT_ID?: string;
  PAYFAST_MERCHANT_KEY?: string;
  PAYFAST_PASSPHRASE?: string;
  /** Public site origin for return/cancel/notify URLs (no trailing slash) */
  PUBLIC_SITE_URL?: string;
  /** Team retrieval credential (Bearer / x-design-studio-team-token). Prefer Cloudflare Access too. */
  DESIGN_STUDIO_TEAM_TOKEN?: string;
  /** FormSubmit destination for paid-project handoff emails */
  DESIGN_STUDIO_NOTIFY_EMAIL?: string;
}

export type DesignStudioProjectRow = {
  id: string;
  public_reference: string;
  access_token_hash: string;
  status: string;
  prompt_version: string | null;
  business_name: string | null;
  industry: string | null;
  website_type: string | null;
  brief_json: string;
  selected_concept_id: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  preferred_timing: string | null;
  designer_note: string | null;
  created_at: string;
  updated_at: string;
  generation_started_at: string | null;
  generation_completed_at: string | null;
  paid_at: string | null;
  /** Present after migration 0002 — treat missing as 0 at runtime */
  generation_attempts?: number | null;
};

/** Public project shape — never includes access_token_hash. */
export type PublicDesignProject = Omit<DesignStudioProjectRow, 'access_token_hash'> & {
  brief: unknown;
};
