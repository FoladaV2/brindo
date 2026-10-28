import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Fixed-window rate limiting in Postgres (public.hit_rate_limit, service role only). Callers pick a
 * key that stores no personal data (hash it) and a limit.
 */

export type RateLimit = { requests: number; windowMs: number };

/** Start of the fixed window `now` falls in. */
export function windowStart(now: number, windowMs: number): number {
  return now - (now % windowMs);
}

/** Counts this request. Returns null if allowed, otherwise the seconds until the window ends. */
export async function hitRateLimit(key: string, limit: RateLimit, now: number): Promise<number | null> {
  const start = windowStart(now, limit.windowMs);
  const { data, error } = await createServiceClient().rpc("hit_rate_limit", {
    p_key: key,
    p_window_start: new Date(start).toISOString(),
  });
  if (error) throw error;
  if (data <= limit.requests) return null;
  return Math.max(1, Math.ceil((start + limit.windowMs - now) / 1000));
}

/**
 * The client IP. On Vercel, x-real-ip and x-forwarded-for are set by the platform; a client cannot
 * spoof them. Elsewhere (local development) it is "unknown", so keys fall back to their other parts.
 */
export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}
