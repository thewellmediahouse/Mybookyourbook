import { PUBLIC_PATHS } from "../lib/site/meta";

const BASE = (process.env.PREVIEW_URL ?? "http://127.0.0.1:8787").replace(/\/$/, "");
const VENDOR = /seedance|topaz|fal\.ai|reapi|ffmpeg|inference|workerd|cloudflare workers/i;

async function get(path: string, init?: RequestInit) {
  const response = await fetch(`${BASE}${path}`, { redirect: "manual", ...init });
  const body = await response.text();
  return { response, body };
}

function fail(message: string): never {
  throw new Error(message);
}

async function main() {
  const publicOk: string[] = [];
  for (const path of PUBLIC_PATHS) {
    const { response, body } = await get(path);
    if (response.status !== 200) {
      fail(`${path} expected 200, got ${response.status}`);
    }
    if (VENDOR.test(body)) {
      fail(`${path} leaked a vendor or infrastructure name to customers`);
    }
    publicOk.push(path);
  }

  const dashboard = await get("/dashboard");
  const dashboardLocation = dashboard.response.headers.get("location") ?? "";
  if (
    ![301, 302, 303, 307, 308].includes(dashboard.response.status) ||
    !dashboardLocation.includes("/login")
  ) {
    fail(`/dashboard should send anonymous visitors to login (got ${dashboard.response.status} ${dashboardLocation})`);
  }

  const produce = await get("/api/production/start", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ projectId: "00000000-0000-0000-0000-000000000001" }),
  });
  if (produce.response.status !== 401) {
    fail(`/api/production/start should require sign-in (got ${produce.response.status} ${produce.body.slice(0, 200)})`);
  }

  const login = await get("/api/auth/sign-in/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "preview.smoke@cineyou.test", password: "StudioPass1" }),
  });
  if (login.response.ok) {
    fail("sign-in with an unknown account should not succeed");
  }

  console.log(
    `preview smoke ok at ${BASE}: ${publicOk.length} public pages, dashboard login redirect, produce 401, auth handler alive`,
  );
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
