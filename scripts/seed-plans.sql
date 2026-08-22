-- Catalog pricing from CINEYOU_MASTER_SPEC Sections BP–BQ.
-- Idempotent. Not fake revenue — these are the advertised list prices.

INSERT OR IGNORE INTO plans (id, code, name, region, currency, amount_minor, credits, interval, active, metadata_json)
VALUES
  ('plan_za_first', 'first_commercial', 'First Commercial', 'ZA', 'ZAR', 59900, 1, 'one_time', 1, '{"introductory":true}'),
  ('plan_za_single', 'single', 'Single Commercial', 'ZA', 'ZAR', 79900, 1, 'one_time', 1, NULL),
  ('plan_za_starter', 'starter', 'Starter', 'ZA', 'ZAR', 149900, 2, 'month', 1, NULL),
  ('plan_za_business', 'business', 'Business', 'ZA', 'ZAR', 349900, 5, 'month', 1, '{"highlighted":true}'),
  ('plan_za_growth', 'growth', 'Growth', 'ZA', 'ZAR', 599900, 10, 'month', 1, NULL),
  ('plan_za_agency', 'agency', 'Agency', 'ZA', 'ZAR', NULL, NULL, 'month', 1, '{"custom":true}'),
  ('plan_int_single', 'single', 'Single', 'INT', 'USD', 4900, 1, 'one_time', 1, NULL),
  ('plan_int_starter', 'starter', 'Starter', 'INT', 'USD', 8900, 2, 'month', 1, NULL),
  ('plan_int_business', 'business', 'Business', 'INT', 'USD', 19900, 5, 'month', 1, '{"highlighted":true}'),
  ('plan_int_growth', 'growth', 'Growth', 'INT', 'USD', 34900, 10, 'month', 1, NULL),
  ('plan_int_agency', 'agency', 'Agency', 'INT', 'USD', 69900, NULL, 'month', 1, '{"from":true}');
