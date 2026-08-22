import { test } from "node:test";
import assert from "node:assert/strict";
import { newId } from "@/lib/id";
import { GET_EXPIRES_SECONDS, signR2Request } from "./sign";
test("signed GET URLs expire and stay on the object key", async () => {
  const workspaceId = newId();
  const key = `workspaces/${workspaceId}/projects/${newId()}/final/master/${newId()}`;
  const signed = await signR2Request(
    {
      accountId: "testaccountid",
      accessKeyId: "AKIAEXAMPLEKEYID",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      bucket: "cineyou-production",
    },
    { method: "GET", objectKey: key, expiresIn: GET_EXPIRES_SECONDS },
  );
  assert.equal(signed.method, "GET");
  assert.equal(signed.expiresIn, GET_EXPIRES_SECONDS);
  assert.match(signed.url, new RegExp(`X-Amz-Expires=${GET_EXPIRES_SECONDS}`));
  assert.match(signed.url, new RegExp(workspaceId));
});

test("signed PUT URLs include the workspace key and expiry, not another studio", async () => {
  const workspaceId = newId();
  const other = newId();
  const key = `workspaces/${workspaceId}/brands/${newId()}/logo/${newId()}`;
  const signed = await signR2Request(
    {
      accountId: "testaccountid",
      accessKeyId: "AKIAEXAMPLEKEYID",
      secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      bucket: "cineyou-production",
    },
    { method: "PUT", objectKey: key, contentType: "image/png", expiresIn: 900 },
  );
  assert.equal(signed.method, "PUT");
  assert.equal(signed.expiresIn, 900);
  assert.match(signed.url, /X-Amz-Expires=900/);
  assert.match(signed.url, new RegExp(workspaceId));
  assert.equal(signed.url.includes(other), false);
  assert.equal(signed.headers["Content-Type"], "image/png");
});
