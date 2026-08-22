import assert from "node:assert/strict";
import { test } from "node:test";
import { resetPasswordEventKey, verifyEmailEventKey } from "./copy";

test("verification keys stay unique when JWT prefixes match", () => {
  const header = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InVzZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3";
  const a = `http://localhost:3000/api/auth/verify-email?token=${header}aaaa.signature-one`;
  const b = `http://localhost:3000/api/auth/verify-email?token=${header}bbbb.signature-two`;
  assert.notEqual(verifyEmailEventKey(a), verifyEmailEventKey(b));
  assert.match(verifyEmailEventKey(a), /^verify-email\/.+/);
});

test("reset keys use the token query, not a shared prefix", () => {
  const a = "http://localhost:3000/api/auth/reset-password?token=aaaaaaaaaaaaaaaa";
  const b = "http://localhost:3000/api/auth/reset-password?token=bbbbbbbbbbbbbbbb";
  assert.notEqual(resetPasswordEventKey(a), resetPasswordEventKey(b));
});
