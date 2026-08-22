import { test } from "node:test";
import assert from "node:assert/strict";
import { createResendEmailProvider } from "./email/resend";
import { getEmailProvider } from "./email";

test("mock mode is used when Resend is not configured", () => {
  const provider = getEmailProvider({});
  assert.equal(provider.send.name, "send");
});

test("Resend live send uses Idempotency-Key and never attaches files", async () => {
  const calls: { url: string; headers: Headers; body: string }[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      url: String(input),
      headers: new Headers(init?.headers),
      body: String(init?.body ?? ""),
    });
    return new Response(JSON.stringify({ id: "49a3999c-0ce1-4ea6-ab68-afcd6dc2e794" }), { status: 200 });
  }) as typeof fetch;
  try {
    const provider = createResendEmailProvider("re_test", "Production30 <studio@production30.test>");
    await provider.send({
      to: "owner@cineyou.test",
      subject: "Your Production30 commercial is ready",
      text: "Ready",
      html: "<p>Ready</p>",
      idempotencyKey: "production-ready/job/user",
    });
  } finally {
    globalThis.fetch = original;
  }
  assert.equal(calls.length, 1);
  assert.equal(calls[0]?.url, "https://api.resend.com/emails");
  assert.equal(calls[0]?.headers.get("Idempotency-Key"), "production-ready/job/user");
  assert.equal(calls[0]?.headers.get("Authorization"), "Bearer re_test");
  const payload = JSON.parse(calls[0]?.body ?? "{}") as { attachments?: unknown; to: string[] };
  assert.equal("attachments" in payload, false);
  assert.deepEqual(payload.to, ["owner@cineyou.test"]);
});
