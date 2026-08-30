import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { proxy } from "../../middleware";

function request(path: string, cookie?: string) {
  const headers = new Headers();
  if (cookie) {
    headers.set("cookie", cookie);
  }
  return new NextRequest(new URL(path, "http://localhost:3000"), { headers });
}

test("anonymous visitors are sent to login from the dashboard", () => {
  const response = proxy(request("/dashboard"));
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location") ?? "").pathname, "/login");
});

test("a session cookie on Overview is sent to Studio", () => {
  const response = proxy(request("/dashboard", "better-auth.session_token=test"));
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location") ?? "").pathname, "/dashboard/create");
});

test("a session cookie is enough for the studio cookie check to pass through", () => {
  const response = proxy(request("/dashboard/create", "better-auth.session_token=test"));
  assert.equal(response.status, 200);
});

test("anonymous visitors are sent to login from admin", () => {
  const response = proxy(request("/admin"));
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location") ?? "").pathname, "/login");
});

test("signed-in visitors are sent away from login", () => {
  const response = proxy(request("/login", "better-auth.session_token=test"));
  assert.equal(response.status, 307);
  assert.equal(new URL(response.headers.get("location") ?? "").pathname, "/dashboard/create");
});
