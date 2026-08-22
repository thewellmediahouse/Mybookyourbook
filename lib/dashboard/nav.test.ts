import { test } from "node:test";
import assert from "node:assert/strict";
import { DESKTOP_NAV, MOBILE_NAV, navItemActive } from "./nav";

test("desktop navigation labels match the spec", () => {
  assert.deepEqual(
    DESKTOP_NAV.map((item) => item.label),
    [
      "Overview",
      "Create Commercial",
      "Commercials",
      "Brands",
      "AI Identity",
      "Media Library",
      "Credits",
      "Billing",
      "Notifications",
      "Team",
      "Settings",
      "Help",
    ],
  );
});

test("mobile navigation labels match the spec", () => {
  assert.deepEqual(
    MOBILE_NAV.map((item) => item.label),
    ["Home", "Commercials", "Create", "Credits", "Account"],
  );
});

test("overview is exact so create does not stay highlighted", () => {
  assert.equal(navItemActive("/dashboard", "/dashboard", true), true);
  assert.equal(navItemActive("/dashboard/create", "/dashboard", true), false);
  assert.equal(navItemActive("/dashboard/settings/profile", "/dashboard/settings", false), true);
});
