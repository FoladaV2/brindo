import "server-only";
import { createHash } from "node:crypto";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { createServiceClient } from "@/lib/supabase/service";
import { deviceFrom, isBot, normalizePath, referrerHost } from "./page-view";

/** One browser may record this many views an hour; a reader never gets near it, a script does. */
const PAGE_VIEW_LIMIT = { requests: 120, windowMs: 60 * 60_000 } as const;

/** The day in Tbilisi, so "one visitor per day" follows the site's own calendar. */
const tbilisiDay = (now: number) => new Date(now + 4 * 3600_000).toISOString().slice(0, 10);

/**
 * The anonymous daily visitor id: a SHA-256 of a server secret, the day, the IP and the user
 * agent. Without the secret the hash can't be matched to an IP, and it changes every day.
 */
export function visitorId(ip: string, userAgent: string, now: number, secret = process.env.ANALYTICS_SECRET ?? ""): string {
  return createHash("sha256").update(`${secret}\n${tbilisiDay(now)}\n${ip}\n${userAgent}`).digest("hex");
}

/** People who asked not to be tracked (Do Not Track, Global Privacy Control). */
export const optedOut = (headers: Headers) => headers.get("dnt") === "1" || headers.get("sec-gpc") === "1";

/**
 * Records one page view, or nothing. Never throws: analytics must not break a page, also not
 * before the page_views table exists.
 */
export async function recordPageView(input: { path: unknown; referrer: unknown }, headers: Headers, now = Date.now()): Promise<void> {
  try {
    const userAgent = headers.get("user-agent");
    if (isBot(userAgent) || optedOut(headers) || typeof input.path !== "string") return;
    const path = normalizePath(input.path);
    if (!path) return;

    const visitor = visitorId(clientIp(headers), userAgent!, now);
    if ((await hitRateLimit(`pv:${visitor}`, PAGE_VIEW_LIMIT, now)) !== null) return;

    const ownHost = (() => {
      try {
        return new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost").hostname;
      } catch {
        return "localhost";
      }
    })();
    await createServiceClient()
      .from("page_views")
      .insert({
        visitor,
        path,
        referrer_host: referrerHost(typeof input.referrer === "string" ? input.referrer : null, ownHost),
        device: deviceFrom(userAgent!),
      });
  } catch {
    // Missing table, missing key, network: the page view is simply not counted.
  }
}
