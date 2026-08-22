import { test } from "node:test";
import assert from "node:assert/strict";
import { createUnavailableBusinessImporter } from "./business";

test("website import does not invent business details", async () => {
  const result = await createUnavailableBusinessImporter().import("https://example.com");
  assert.equal(result.status, "unavailable");
  assert.equal(Object.keys(result.fields).length, 0);
  assert.ok(result.warnings.length > 0);
});
