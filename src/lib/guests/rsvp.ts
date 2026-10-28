import "server-only";
import { createHash } from "node:crypto";
import { z } from "zod";
import { rsvpOpen } from "@/lib/invitations/datetime";
import { slugSchema } from "@/lib/invitations/public";
import { invitationContentSchema } from "@/lib/invitations/schema";
import { createServiceClient } from "@/lib/supabase/service";
import { GUEST_LIMITS, guestToken } from "./schema";

/**
 * Guest RSVP, server side. Guests are not signed in: the token in their personal link is the only
 * credential. Everything here runs with the service role, so every query filters by token, slug and
 * published status itself. Client-sent ids are never accepted.
 */

export type SavedRsvp = { attending: boolean; partySize: number };

export type TokenGuest = {
  id: string;
  name: string;
  maxPartySize: number;
  rsvp: SavedRsvp | null;
  /** The invitation's RSVP deadline, YYYY-MM-DD (Tbilisi). */
  deadline: string;
};

/**
 * The guest a token belongs to, if the token belongs to this slug and the invitation is published.
 * Null in every other case, without saying which.
 */
export async function findGuestByToken(slug: string, token: string): Promise<TokenGuest | null> {
  if (!slugSchema.safeParse(slug).success || !guestToken.safeParse(token).success) return null;

  const { data, error } = await createServiceClient()
    .from("guests")
    .select("id, name, max_party_size, invitations!inner(slug, status, content), rsvps(attending, party_size)")
    .eq("token", token)
    .eq("invitations.slug", slug)
    .eq("invitations.status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const content = invitationContentSchema.safeParse(data.invitations.content);
  if (!content.success) return null;
  // rsvps.guest_id is the primary key, so PostgREST embeds one object (or null), not an array.
  const rsvp = data.rsvps;
  return {
    id: data.id,
    name: data.name,
    maxPartySize: data.max_party_size,
    rsvp: rsvp && { attending: rsvp.attending, partySize: rsvp.party_size },
    deadline: content.data.rsvpDeadline,
  };
}

// Rate limiting --------------------------------------------------------------------

export const RSVP_RATE_LIMIT = { requests: 10, windowMs: 10 * 60_000 } as const;

/** Rate-limit key: a hash of the client IP and the token, so neither is stored. */
export function rateLimitKey(ip: string, token: string): string {
  return `rsvp:${createHash("sha256").update(`${ip}\n${token}`).digest("hex")}`;
}

/** Start of the fixed window `now` falls in. */
export function windowStart(now: number, windowMs: number = RSVP_RATE_LIMIT.windowMs): number {
  return now - (now % windowMs);
}

/** Counts this request. Returns null if allowed, otherwise the seconds until the window ends. */
export async function hitRateLimit(key: string, now: number): Promise<number | null> {
  const start = windowStart(now);
  const { data, error } = await createServiceClient().rpc("hit_rate_limit", {
    p_key: key,
    p_window_start: new Date(start).toISOString(),
  });
  if (error) throw error;
  if (data <= RSVP_RATE_LIMIT.requests) return null;
  return Math.max(1, Math.ceil((start + RSVP_RATE_LIMIT.windowMs - now) / 1000));
}

/**
 * The client IP. On Vercel, x-real-ip and x-forwarded-for are set by the platform; a client cannot
 * spoof them. Elsewhere (local development) the key falls back to the token alone.
 */
export function clientIp(headers: Headers): string {
  return headers.get("x-real-ip") ?? headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// Submitting -----------------------------------------------------------------------

export const rsvpRequestSchema = z.object({
  slug: slugSchema,
  token: guestToken,
  attending: z.boolean(),
  /** People coming, the guest included. Ignored for a "No". */
  partySize: z.number().int().min(0).max(GUEST_LIMITS.partySize),
});

export type RsvpRequest = z.infer<typeof rsvpRequestSchema>;

export type RsvpError = "invalid" | "not_found" | "closed" | "party_size" | "rate_limited" | "failed";

export type RsvpOutcome = { ok: true; rsvp: SavedRsvp } | { ok: false; error: RsvpError };

/** Checks the deadline and party size against the stored guest, then writes their one RSVP row. */
export async function submitRsvp(guest: TokenGuest, request: RsvpRequest, now: number): Promise<RsvpOutcome> {
  if (!rsvpOpen(guest.deadline, now)) return { ok: false, error: "closed" };

  const partySize = request.attending ? request.partySize : 0;
  if (request.attending && (partySize < 1 || partySize > guest.maxPartySize)) return { ok: false, error: "party_size" };

  const { error } = await createServiceClient()
    .from("rsvps")
    .upsert({ guest_id: guest.id, attending: request.attending, party_size: partySize }, { onConflict: "guest_id" });
  if (error) throw error;
  return { ok: true, rsvp: { attending: request.attending, partySize } };
}
