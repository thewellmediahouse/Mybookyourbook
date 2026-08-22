import { test } from "node:test";
import assert from "node:assert/strict";
import { resolveAdStrategy } from "./ad-strategies";

test("industry strategies resolve to principles, not hardcoded ads", () => {
  assert.equal(resolveAdStrategy("Law firm").id, "legal");
  assert.match(resolveAdStrategy("attorney").focus, /credibility/i);
  assert.match(resolveAdStrategy("attorney").avoid, /guarantees/i);
  assert.equal(resolveAdStrategy("estate agent").id, "real-estate");
  assert.equal(resolveAdStrategy("plumbing").id, "home-services");
  assert.match(resolveAdStrategy("plumbing").focus, /Problem/i);
  assert.equal(resolveAdStrategy("hotel").id, "hospitality");
  assert.equal(resolveAdStrategy("accounting").id, "financial-services");
  assert.match(resolveAdStrategy("accounting").avoid, /performance/i);
  assert.equal(resolveAdStrategy("consulting firm").id, "general");
  assert.equal(resolveAdStrategy(null).id, "general");
});
