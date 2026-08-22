import { test } from "node:test";
import assert from "node:assert/strict";
import { parseLibraryRole, parseLibraryTab } from "./slots";

test("library tabs and roles parse from the URL", () => {
  assert.equal(parseLibraryTab(undefined).id, "logos");
  assert.equal(parseLibraryTab("products").role, "product");
  assert.equal(parseLibraryTab("unknown").id, "logos");
  assert.equal(parseLibraryRole("campaign"), "campaign");
  assert.equal(parseLibraryRole("identity"), null);
});
