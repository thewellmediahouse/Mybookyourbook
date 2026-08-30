import { test } from "node:test";
import assert from "node:assert/strict";
import { DESKTOP_NAV, MOBILE_NAV, STUDIO_HREF, navItemActive } from "./nav";

test("desktop navigation starts at Studio and has no Overview", () => {
  assert.equal(STUDIO_HREF, "/dashboard/create");
  assert.deepEqual(
    DESKTOP_NAV.map((item) => item.label),
    ["Studio", "Reference Profile", "Buy Credits", "Billing", "Settings", "Help"],
  );
});

test("mobile navigation starts at Studio and has no Home overview", () => {
  assert.deepEqual(
    MOBILE_NAV.map((item) => item.label),
    ["Studio", "Credits", "Settings"],
  );
});

test("studio stays highlighted on nested create paths", () => {
  assert.equal(navItemActive("/dashboard/create", STUDIO_HREF, false), true);
  assert.equal(navItemActive("/dashboard/settings/profile", "/dashboard/settings", false), true);
  assert.equal(navItemActive("/dashboard/create", "/dashboard/settings", false), false);
});
