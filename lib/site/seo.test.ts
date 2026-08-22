import { test } from "node:test";
import assert from "node:assert/strict";
import { PUBLIC_PATHS } from "./meta";
import { robotsConfig, sitemapEntries } from "./seo";

test("Section U public routes are listed for sitemap", () => {
  const required = [
    "/",
    "/pricing",
    "/how-it-works",
    "/examples",
    "/privacy",
    "/terms",
    "/acceptable-use",
    "/login",
    "/signup",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
  ];
  for (const path of required) {
    assert.equal(PUBLIC_PATHS.includes(path as (typeof PUBLIC_PATHS)[number]), true, path);
  }
});

test("sitemap uses absolute URLs for every public path", () => {
  const urls = sitemapEntries().map((entry) => entry.url);
  assert.equal(urls.length, PUBLIC_PATHS.length);
  assert.ok(urls.every((url) => url.startsWith("http")));
  assert.ok(urls.some((url) => url.endsWith("/pricing") || url.includes("/pricing")));
});

test("robots allows public pages and blocks studio routes", () => {
  const robots = robotsConfig();
  const rule = Array.isArray(robots.rules) ? robots.rules[0] : robots.rules;
  assert.ok(rule);
  assert.equal(rule.allow, "/");
  assert.deepEqual(rule.disallow, ["/dashboard", "/onboarding", "/admin", "/api/"]);
  assert.ok(typeof robots.sitemap === "string" && robots.sitemap.includes("sitemap.xml"));
});
