import { headers } from "next/headers";
import { db } from "./db";

/**
 * Fixed-window rate limiter stored in Postgres (works across restarts and instances).
 * Returns true if the call is allowed.
 */
export async function rateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt") VALUES (${key}, 1, ${resetAt})
    ON CONFLICT ("key") DO UPDATE SET
      "count"   = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN 1 ELSE "RateLimit"."count" + 1 END,
      "resetAt" = CASE WHEN "RateLimit"."resetAt" <= ${now} THEN ${resetAt} ELSE "RateLimit"."resetAt" END
    RETURNING "count"`;
  // opportunistic cleanup so the table doesn't grow forever
  if (Math.random() < 0.01) await db.rateLimit.deleteMany({ where: { resetAt: { lt: now } } }).catch(() => {});
  return rows[0].count <= limit;
}

/** Best-effort client IP. Behind Render's proxy the forwarded header is set by the platform. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export const MINUTE = 60_000;
export const HOUR = 60 * MINUTE;
