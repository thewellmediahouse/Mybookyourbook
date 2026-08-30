import { test } from "node:test";
import assert from "node:assert/strict";
import { LIBRARY_BODY, LIBRARY_HEADING } from "./copy";
import { LIBRARY_TABS } from "./slots";

test("media library copy and tabs match the spec", () => {
  assert.equal(LIBRARY_HEADING, "Media Library");
  assert.match(LIBRARY_BODY, /Reference Profile stays private/);
  assert.deepEqual(
    LIBRARY_TABS.map((tab) => tab.label),
    ["Logos", "Products", "Business", "Locations", "Campaign References"],
  );
});
