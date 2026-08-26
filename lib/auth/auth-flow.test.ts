import { test } from "node:test";
import assert from "node:assert/strict";
import { createAuth } from "./create-auth";
import { createDb } from "@/lib/db/client";
import type { EmailMessage } from "@/lib/providers/email";

const AUTH_ENV = {
  BETTER_AUTH_SECRET: "cineyou-phase3-test-secret-32chars!",
  BETTER_AUTH_URL: "http://localhost:3000",
};

function extractUrl(text: string) {
  const match = text.match(/https?:\/\/\S+/);
  assert.ok(match, "expected a URL in the email body");
  return match[0];
}

function extractResetToken(url: URL) {
  const fromQuery = url.searchParams.get("token");
  if (fromQuery) {
    return fromQuery;
  }
  const last = url.pathname.split("/").filter(Boolean).at(-1);
  return last && last !== "reset-password" ? last : null;
}

function cookieHeader(response: Response) {
  const getSetCookie = response.headers.getSetCookie?.() ?? [];
  if (getSetCookie.length > 0) {
    return getSetCookie.map((part) => part.split(";")[0]).join("; ");
  }
  const single = response.headers.get("set-cookie");
  return single ? single.split(";")[0] : "";
}

test("signup, session cookie, and password reset against local D1", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });

  const sent: EmailMessage[] = [];
  const auth = createAuth(createDb(proxy.env.DB as D1Database), AUTH_ENV, {
    email: {
      async send(message) {
        sent.push(message);
      },
    },
  });

  const email = `phase3.${Date.now()}@cineyou.test`;
  const password = "StudioPass1";
  const nextPassword = "StudioPass2";

  const signUp = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name: "Alex Example",
        firstName: "Alex",
        lastName: "Example",
      }),
    }),
  );
  assert.equal(signUp.ok, true, await signUp.clone().text());

  const blocked = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    }),
  );
  assert.equal(blocked.status, 403);

  const verifyMail = sent.find((message) => message.subject.includes("Verify"));
  assert.ok(verifyMail);
  const verifyUrl = extractUrl(verifyMail.text);
  const verify = await auth.handler(new Request(verifyUrl));
  assert.ok(
    verify.status === 200 || verify.status === 302,
    `${verify.status} ${verifyUrl} ${await verify.clone().text()}`,
  );
  const sessionCookie = cookieHeader(verify);
  assert.match(sessionCookie, /session_token/);

  sent.length = 0;
  const forgot = await auth.handler(
    new Request("http://localhost:3000/api/auth/request-password-reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, redirectTo: "http://localhost:3000/reset-password" }),
    }),
  );
  assert.equal(forgot.ok, true, await forgot.clone().text());
  const resetMail = sent.find((message) => message.subject.includes("Reset"));
  assert.ok(resetMail);
  const resetLink = extractUrl(resetMail.text);
  const resetUrl = new URL(resetLink);
  const token = extractResetToken(resetUrl);
  assert.ok(token, resetLink);

  const reset = await auth.handler(
    new Request("http://localhost:3000/api/auth/reset-password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, newPassword: nextPassword }),
    }),
  );
  assert.equal(reset.ok, true, await reset.clone().text());

  const signIn = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password: nextPassword }),
    }),
  );
  assert.equal(signIn.ok, true, await signIn.clone().text());
  assert.match(cookieHeader(signIn), /session_token/);
});

test("signing up again with an unverified email sends another confirmation", async (t) => {
  const { getPlatformProxy } = await import("wrangler");
  const proxy = await getPlatformProxy({ persist: true });
  t.after(async () => {
    await proxy.dispose();
  });

  const sent: EmailMessage[] = [];
  const auth = createAuth(createDb(proxy.env.DB as D1Database), AUTH_ENV, {
    email: {
      async send(message) {
        sent.push(message);
      },
    },
  });

  const email = `phase3.again.${Date.now()}@cineyou.test`;
  const password = "StudioPass1";
  const first = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name: "Alex Example",
        firstName: "Alex",
        lastName: "Example",
      }),
    }),
  );
  assert.equal(first.ok, true, await first.clone().text());
  const firstVerify = sent.filter((message) => message.subject.includes("Verify"));
  assert.equal(firstVerify.length, 1);

  sent.length = 0;
  const again = await auth.handler(
    new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name: "Alex Example",
        firstName: "Alex",
        lastName: "Example",
      }),
    }),
  );
  assert.equal(again.ok, true, await again.clone().text());
  const secondVerify = sent.filter((message) => message.subject.includes("Verify"));
  assert.equal(secondVerify.length, 1);
  const verifyUrl = extractUrl(secondVerify[0]!.text);
  const verify = await auth.handler(new Request(verifyUrl));
  assert.ok(verify.status === 200 || verify.status === 302, `${verify.status} ${verifyUrl}`);
  assert.match(cookieHeader(verify), /session_token/);
});
