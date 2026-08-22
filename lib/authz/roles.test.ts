import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAdminEmails, isPlatformAdmin } from "./admin";
import {
  canManageBilling,
  canManageBrands,
  canManageLibrary,
  canManageMembers,
  canProduce,
  roleAtLeast,
} from "./roles";

test("VIEWER cannot produce; CREATOR can", () => {
  assert.equal(canProduce("VIEWER"), false);
  assert.equal(canProduce("CREATOR"), true);
  assert.equal(canProduce("ADMIN"), true);
  assert.equal(canProduce("OWNER"), true);
});

test("CREATOR cannot manage brands; ADMIN can", () => {
  assert.equal(canManageBrands("CREATOR"), false);
  assert.equal(canManageBrands("ADMIN"), true);
  assert.equal(canManageBrands("OWNER"), true);
  assert.equal(canManageBrands("VIEWER"), false);
});

test("VIEWER cannot change the library; CREATOR can", () => {
  assert.equal(canManageLibrary("VIEWER"), false);
  assert.equal(canManageLibrary("CREATOR"), true);
  assert.equal(canManageLibrary("ADMIN"), true);
  assert.equal(canManageLibrary("OWNER"), true);
});

test("VIEWER cannot invite; ADMIN can", () => {
  assert.equal(canManageMembers("VIEWER"), false);
  assert.equal(canManageMembers("CREATOR"), false);
  assert.equal(canManageMembers("ADMIN"), true);
  assert.equal(canManageMembers("OWNER"), true);
});

test("only OWNER can manage billing", () => {
  assert.equal(canManageBilling("CREATOR"), false);
  assert.equal(canManageBilling("ADMIN"), false);
  assert.equal(canManageBilling("OWNER"), true);
});

test("ADMIN satisfies CREATOR rank but not OWNER", () => {
  assert.equal(roleAtLeast("ADMIN", "CREATOR"), true);
  assert.equal(roleAtLeast("ADMIN", "OWNER"), false);
});

test("platform admin list is email-normalized", () => {
  const list = parseAdminEmails(" Staff@Production30.com , other@x.com ");
  assert.equal(isPlatformAdmin("staff@production30.com", list), true);
  assert.equal(isPlatformAdmin("viewer@production30.com", list), false);
});
