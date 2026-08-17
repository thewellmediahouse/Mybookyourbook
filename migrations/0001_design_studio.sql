-- Design Studio — anonymous projects, concepts, uploads, orders
-- Note: selected_concept_id is stored without a circular FK to design_concepts.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS design_projects (
  id TEXT PRIMARY KEY,
  public_reference TEXT NOT NULL UNIQUE,
  access_token_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  prompt_version TEXT,
  business_name TEXT,
  industry TEXT,
  website_type TEXT,
  brief_json TEXT NOT NULL DEFAULT '{}',
  selected_concept_id TEXT,
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  preferred_timing TEXT,
  designer_note TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generation_started_at TEXT,
  generation_completed_at TEXT,
  paid_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_design_projects_status
  ON design_projects(status);

CREATE INDEX IF NOT EXISTS idx_design_projects_created_at
  ON design_projects(created_at);

CREATE INDEX IF NOT EXISTS idx_design_projects_public_reference
  ON design_projects(public_reference);

CREATE TABLE IF NOT EXISTS design_concepts (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 4),
  status TEXT NOT NULL DEFAULT 'PENDING',
  direction_json TEXT NOT NULL DEFAULT '{}',
  visual_prompt TEXT,
  r2_object_key TEXT,
  mime_type TEXT,
  generation_provider TEXT,
  model_name TEXT,
  error_code TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES design_projects(id) ON DELETE CASCADE,
  UNIQUE(project_id, slot)
);

CREATE INDEX IF NOT EXISTS idx_design_concepts_project
  ON design_concepts(project_id);

CREATE TABLE IF NOT EXISTS design_uploads (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  original_filename TEXT,
  safe_filename TEXT NOT NULL,
  r2_object_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT,
  FOREIGN KEY (project_id) REFERENCES design_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_design_uploads_project
  ON design_uploads(project_id);

CREATE TABLE IF NOT EXISTS design_orders (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  merchant_payment_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  currency TEXT NOT NULL DEFAULT 'ZAR',
  amount_cents INTEGER NOT NULL,
  price_breakdown_json TEXT NOT NULL DEFAULT '{}',
  payfast_payment_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  verified_at TEXT,
  FOREIGN KEY (project_id) REFERENCES design_projects(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_design_orders_project
  ON design_orders(project_id);

CREATE INDEX IF NOT EXISTS idx_design_orders_status
  ON design_orders(status);

CREATE TABLE IF NOT EXISTS payment_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'payfast',
  provider_reference TEXT,
  payload_hash TEXT,
  safe_payload_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, provider_reference, event_type),
  FOREIGN KEY (order_id) REFERENCES design_orders(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payment_events_order
  ON payment_events(order_id);
