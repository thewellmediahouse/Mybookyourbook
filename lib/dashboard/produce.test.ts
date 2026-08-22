import { test } from "node:test";
import assert from "node:assert/strict";
import { produceAvailability } from "./produce";

test("viewers cannot produce", () => {
  const result = produceAvailability({
    role: "VIEWER",
    memberStatus: "active",
    workspaceStatus: "active",
  });
  assert.equal(result.allowed, false);
  if (!result.allowed) {
    assert.match(result.reason, /Viewers/);
  }
});

test("owners can produce when the studio is active", () => {
  const result = produceAvailability({
    role: "OWNER",
    memberStatus: "active",
    workspaceStatus: "active",
  });
  assert.equal(result.allowed, true);
});

test("a paused studio cannot produce", () => {
  const result = produceAvailability({
    role: "OWNER",
    memberStatus: "active",
    workspaceStatus: "suspended",
  });
  assert.equal(result.allowed, false);
});
