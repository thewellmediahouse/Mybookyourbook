import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { FORBIDDEN_PUBLIC_ENV, SECRET_NAME_PATTERN } from "./secrets";

export const BUNDLE_SECRET_NAMES = [
  "REAPI_API_KEY",
  "FAL_KEY",
  "FAL_WEBHOOK_SECRET",
  "TOPAZ_API_KEY",
  "OPENAI_API_KEY",
  "PAYSTACK_SECRET_KEY",
  "PAYFAST_MERCHANT_KEY",
  "PAYFAST_PASSPHRASE",
  "PAYONEER_TOKEN",
  "RAPYD_SECRET_KEY",
  "RAPYD_ACCESS_KEY",
  "BETTER_AUTH_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "INTERNAL_SERVICE_SECRET",
  "R2_SECRET_ACCESS_KEY",
] as const;

const CLIENT_ENV_LEAK = new RegExp(
  String.raw`process\.env\.(?:NEXT_PUBLIC_)?(?:${BUNDLE_SECRET_NAMES.join("|")})`,
);

export type BundleLeak = { file: string; reason: string };

function walkFiles(dir: string, matches: (name: string) => boolean, found: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return found;
  }
  for (const name of entries) {
    if (name === "node_modules" || name === ".git") {
      continue;
    }
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walkFiles(full, matches, found);
    } else if (matches(name)) {
      found.push(full);
    }
  }
  return found;
}

export function knownSecretValues(env: NodeJS.ProcessEnv = process.env): string[] {
  const values: string[] = [];
  for (const name of BUNDLE_SECRET_NAMES) {
    const value = env[name]?.trim();
    if (value && value.length >= 16) {
      values.push(value);
    }
  }
  return values;
}

export function scanTextForBundleLeaks(text: string, knownValues: string[]): string[] {
  const reasons: string[] = [];
  if (CLIENT_ENV_LEAK.test(text)) {
    reasons.push("process.env secret on the client");
  }
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("NEXT_PUBLIC_") && FORBIDDEN_PUBLIC_ENV.test(trimmed.split("=")[0] ?? "")) {
      reasons.push(`forbidden public env ${trimmed.split("=")[0]}`);
    }
  }
  for (const value of knownValues) {
    if (text.includes(value)) {
      reasons.push("secret value present");
    }
  }
  return reasons;
}

export function scanClientSources(root: string): BundleLeak[] {
  const files = [
    ...walkFiles(join(root, "app"), (name) => name.endsWith(".tsx") || name.endsWith(".ts")),
    ...walkFiles(join(root, "components"), (name) => name.endsWith(".tsx") || name.endsWith(".ts")),
  ];
  const leaks: BundleLeak[] = [];
  for (const file of files) {
    if (file.includes(`${join("app", "api")}`) || file.endsWith("actions.ts") || file.endsWith("route.ts")) {
      continue;
    }
    const text = readFileSync(file, "utf8");
    const isClient = /^\s*["']use client["']/m.test(text.slice(0, 400));
    if (isClient) {
      for (const reason of scanTextForBundleLeaks(text, [])) {
        leaks.push({ file, reason });
      }
      continue;
    }
    for (const line of text.split("\n")) {
      const name = line.trim().split("=")[0]?.trim() ?? "";
      if (name.startsWith("NEXT_PUBLIC_") && FORBIDDEN_PUBLIC_ENV.test(name)) {
        leaks.push({ file, reason: `forbidden public env ${name}` });
      }
    }
  }
  return leaks;
}

export function scanBuiltClientBundle(root: string, knownValues: string[]): BundleLeak[] {
  const dir = join(root, ".next/static");
  const files = walkFiles(dir, (name) => name.endsWith(".js") || name.endsWith(".json"));
  const leaks: BundleLeak[] = [];
  for (const file of files) {
    const text = readFileSync(file, "utf8");
    for (const reason of scanTextForBundleLeaks(text, knownValues)) {
      leaks.push({ file, reason });
    }
    for (const name of BUNDLE_SECRET_NAMES) {
      if (SECRET_NAME_PATTERN.test(name) && text.includes(`"${name}":`) && knownValues.some((value) => text.includes(value))) {
        leaks.push({ file, reason: `${name} value in client chunk` });
      }
    }
  }
  return leaks;
}
