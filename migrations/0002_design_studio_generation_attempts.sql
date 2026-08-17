-- Design Studio hardening: track generation attempts to prevent unlimited FAILED retries.

PRAGMA foreign_keys = ON;

ALTER TABLE design_projects
  ADD COLUMN generation_attempts INTEGER NOT NULL DEFAULT 0;
