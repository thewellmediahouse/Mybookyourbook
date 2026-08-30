import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "../..");

test("Workers config keeps mock AI and test payments explicit", () => {
  const wrangler = readFileSync(join(ROOT, "wrangler.jsonc"), "utf8");
  assert.match(wrangler, /"AI_PROVIDER_MODE": "mock"/);
  assert.match(wrangler, /"FILMING_AI_MODE": "live"/);
  assert.match(wrangler, /"CONCEPT_AI_MODE": "live"/);
  assert.match(wrangler, /"PAYMENTS_MODE": "test"/);
  assert.match(wrangler, /nodejs_compat/);
  assert.match(wrangler, /"database_id": "[0-9a-f-]{36}"/);
  assert.doesNotMatch(wrangler, /00000000-0000-0000-0000-000000000000/);
});

test("Worker entry exports the workflow and media container", () => {
  const worker = readFileSync(join(ROOT, "worker.ts"), "utf8");
  assert.match(worker, /export \{ CommercialProductionWorkflow \}/);
  assert.match(worker, /export \{ MediaProcessingService \}/);
  assert.match(worker, /queue\(batch/);
});
