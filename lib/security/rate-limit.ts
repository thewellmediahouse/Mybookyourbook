import { and, eq, gt, lt } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { rateLimitEvents } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { RATE_LIMIT_MESSAGE } from "./copy";
import { RateLimitError } from "./errors";

export const RATE_LIMITS = {
  signup: { max: 8, windowMs: 60 * 60 * 1000 },
  login: { max: 20, windowMs: 15 * 60 * 1000 },
  reset: { max: 8, windowMs: 60 * 60 * 1000 },
  import: { max: 12, windowMs: 60 * 60 * 1000 },
  upload: { max: 40, windowMs: 10 * 60 * 1000 },
  checkout: { max: 10, windowMs: 60 * 60 * 1000 },
  production: { max: 8, windowMs: 10 * 60 * 1000 },
  webhook: { max: 180, windowMs: 60 * 1000 },
} as const;

export type RateLimitAction = keyof typeof RATE_LIMITS;

export function rateLimitBucket(action: RateLimitAction, subject: string) {
  return `${action}:${subject.trim().toLowerCase()}`;
}

export async function assertRateLimit(db: Db, action: RateLimitAction, subject: string) {
  const key = subject.trim();
  if (!key) {
    throw new RateLimitError(RATE_LIMIT_MESSAGE);
  }
  const config = RATE_LIMITS[action];
  const bucket = rateLimitBucket(action, key);
  const now = Date.now();
  const since = new Date(now - config.windowMs);
  await db
    .delete(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucket, bucket), lt(rateLimitEvents.createdAt, since)));
  const rows = await db
    .select({ id: rateLimitEvents.id })
    .from(rateLimitEvents)
    .where(and(eq(rateLimitEvents.bucket, bucket), gt(rateLimitEvents.createdAt, since)));
  if (rows.length >= config.max) {
    throw new RateLimitError(RATE_LIMIT_MESSAGE);
  }
  await db.insert(rateLimitEvents).values({
    id: newId(),
    bucket,
    createdAt: new Date(now),
  });
}

export type WorkersRateLimit = {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
};

/** Optional Cloudflare Rate Limiting binding. No-op when the binding is missing (local / tests). */
export async function assertWorkersRateLimit(
  limiter: WorkersRateLimit | undefined,
  key: string,
) {
  if (!limiter || typeof limiter.limit !== "function") {
    return;
  }
  const { success } = await limiter.limit({ key });
  if (!success) {
    throw new RateLimitError(RATE_LIMIT_MESSAGE);
  }
}
