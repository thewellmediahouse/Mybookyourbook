import { test } from "node:test";
import assert from "node:assert/strict";
import {
  canUseProviderHrefs,
  providerObjectHref,
  signProviderObjectToken,
  verifyProviderObjectToken,
  workspaceIdFromObjectKey,
} from "./provider-href";

const SECRET = "provider-href-test-secret";
const KEY = "workspaces/11111111-1111-4111-8111-111111111111/users/u/identity/front/o";

test("provider tokens verify and reject tampers and expiry", () => {
  const exp = Math.floor(Date.now() / 1000) + 60;
  const token = signProviderObjectToken(SECRET, KEY, exp);
  assert.deepEqual(verifyProviderObjectToken(SECRET, token, exp - 1), { objectKey: KEY });
  assert.equal(verifyProviderObjectToken("other", token, exp - 1), null);
  assert.equal(verifyProviderObjectToken(SECRET, `${token}x`, exp - 1), null);
  assert.equal(verifyProviderObjectToken(SECRET, token, exp + 1), null);
});

test("provider hrefs are public https paths", () => {
  assert.equal(canUseProviderHrefs("https://production30.thewellmedia.com", SECRET), true);
  assert.equal(canUseProviderHrefs("http://localhost:3000", SECRET), false);
  const href = providerObjectHref({
    appUrl: "https://production30.thewellmedia.com/",
    secret: SECRET,
    objectKey: KEY,
    nowSeconds: 1_700_000_000,
  });
  assert.match(href, /^https:\/\/production30\.thewellmedia\.com\/api\/provider\/files\//);
  assert.equal(workspaceIdFromObjectKey(KEY), "11111111-1111-4111-8111-111111111111");
});
