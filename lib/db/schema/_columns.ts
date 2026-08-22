import { sql } from "drizzle-orm";
import { integer } from "drizzle-orm/sqlite-core";

/** Unix ms. App code still sets timestamps explicitly on writes. */
export const unixMsNow = sql`(cast(unixepoch() * 1000 as integer))`;

export function timestampMs(name: string) {
  return integer(name, { mode: "timestamp_ms" });
}

export const createdAt = timestampMs("created_at").notNull().default(unixMsNow);
export const updatedAt = timestampMs("updated_at").notNull().default(unixMsNow);
