import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchPublicPageMeta, parsePageMetaFromHtml, parsePublicHttpUrl } from "./page-meta";

test("page meta parser reads published Open Graph fields only", () => {
  const meta = parsePageMetaFromHtml(
    `<html><head>
      <title>Fallback</title>
      <meta property="og:title" content="Harbour Cafe" />
      <meta name="description" content="Coffee on the waterfront." />
    </head></html>`,
    "https://harbour.example/",
  );
  assert.equal(meta.title, "Harbour Cafe");
  assert.equal(meta.description, "Coffee on the waterfront.");
});

test("public website URLs reject localhost and private hosts", () => {
  assert.equal(parsePublicHttpUrl("https://harbour.example")?.hostname, "harbour.example");
  assert.equal(parsePublicHttpUrl("http://localhost/admin"), null);
  assert.equal(parsePublicHttpUrl("https://127.0.0.1/"), null);
  assert.equal(parsePublicHttpUrl("http://192.168.0.10/"), null);
  assert.equal(parsePublicHttpUrl("http://10.0.0.8/secret"), null);
});

test("fetchPublicPageMeta does not invent fields when HTML has none", async () => {
  const result = await fetchPublicPageMeta("https://example.com/empty", async () => {
    return new Response("<html><body>No tags</body></html>", {
      status: 200,
      headers: { "content-type": "text/html" },
    });
  });
  assert.equal(result.ok, false);
});

test("fetchPublicPageMeta refuses a redirect onto a private host", async () => {
  const result = await fetchPublicPageMeta("https://example.com", async () => {
    const response = new Response("<html><title>Secret</title></html>", { status: 200 });
    Object.defineProperty(response, "url", { value: "http://127.0.0.1/meta" });
    return response;
  });
  assert.equal(result.ok, false);
});
