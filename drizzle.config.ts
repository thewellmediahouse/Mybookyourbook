import { defineConfig } from "drizzle-kit";

/** Generate SQL only. Apply with Wrangler D1 — do not use drizzle-kit push against production. */
export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "sqlite",
});
