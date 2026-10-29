/**
 * Anonymous page views (SPEC.md "Admin"). What is recorded is decided here, in pure functions:
 * a normalized path (no ids, no slugs, no query), the referring site's host, and a device class.
 * Nothing that identifies a person.
 */

/** Pages never counted: tools, previews and the admin area itself. */
const SKIP = /^\/(admin|preview|styleguide|api|_next|auth)(\/|$)/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * "/i/anas-30-k7xq" → "/i/:slug", "/dashboard/invitations/<uuid>/edit" → "/dashboard/invitations/:id/edit".
 * Null for pages that are not counted, or anything that doesn't look like one of our paths.
 */
export function normalizePath(raw: string): string | null {
  const path = raw.split(/[?#]/)[0] ?? "";
  if (!path.startsWith("/") || path.length > 200 || SKIP.test(path)) return null;
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "i" && parts.length >= 2) return parts.length === 2 ? "/i/:slug" : null;
  const normalized = "/" + parts.map((part) => (UUID.test(part) ? ":id" : part)).join("/");
  return /^\/[A-Za-z0-9/:_-]{0,120}$/.test(normalized) ? normalized : null;
}

/** Crawlers, link-preview fetchers and headless browsers. */
const BOT = /bot|crawl|spider|slurp|preview|facebookexternalhit|whatsapp|viber|telegram|discord|headless|lighthouse|monitor|curl|wget|python|node-fetch/i;

export function isBot(userAgent: string | null): boolean {
  return !userAgent || BOT.test(userAgent);
}

export type Device = "mobile" | "tablet" | "desktop";

export function deviceFrom(userAgent: string): Device {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(userAgent)) return "tablet";
  if (/mobi|iphone|android/i.test(userAgent)) return "mobile";
  return "desktop";
}

/** The referring site's host ("instagram.com"), or null for direct visits and our own pages. */
export function referrerHost(referrer: string | null | undefined, ownHost: string): string | null {
  if (!referrer) return null;
  try {
    const host = new URL(referrer).hostname.replace(/^(www\.|m\.|l\.|lm\.)/, "").toLowerCase();
    if (!host || host === ownHost.replace(/^www\./, "").toLowerCase()) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}
