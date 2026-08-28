import { test } from "node:test";
import assert from "node:assert/strict";
import { getAuthBaseUrl, getTrustedAuthOrigins, PUBLIC_APP_ORIGIN, WORKERS_DEV_ORIGIN } from "./env";

test("auth base URL prefers BETTER_AUTH_URL", () => {
  assert.equal(
    getAuthBaseUrl({
      BETTER_AUTH_URL: "https://production30.thewellmedia.com",
      NEXT_PUBLIC_APP_URL: "https://cineyou.schalk-966.workers.dev",
    }),
    "https://production30.thewellmedia.com",
  );
});

test("trusted origins always include the public host and workers.dev", () => {
  const origins = getTrustedAuthOrigins({
    BETTER_AUTH_URL: "https://production30.thewellmedia.com",
    NEXT_PUBLIC_APP_URL: "https://production30.thewellmedia.com",
  });
  assert.deepEqual(
    origins.sort(),
    [PUBLIC_APP_ORIGIN, WORKERS_DEV_ORIGIN].sort(),
  );
});
