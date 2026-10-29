import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { rsvpOpen } from "@/lib/invitations/datetime";
import { slugSchema } from "@/lib/invitations/public";
import { invitationContentSchema } from "@/lib/invitations/schema";
import { createServiceClient } from "@/lib/supabase/service";
import { RESPONSE_LIMITS, type RsvpRequest } from "./schema";

/**
 * Guest answers, server side (SPEC.md "Open RSVP"). Guests are not signed in and there is one link
 * per invitation, so anyone holding the link may answer. Everything here runs with the service
 * role: every query filters by slug and published status itself, and client-sent ids are never
 * accepted. A first answer gets a random edit token; only its hash is stored.
 */

export type OpenInvitation = {
  id: string;
  maxPartySize: number;
  /** The RSVP deadline, YYYY-MM-DD (Tbilisi). */
  deadline: string;
};

/** The published invitation behind a slug, or null (unknown, unpublished, or invalid content). */
export async function findOpenInvitation(slug: string): Promise<OpenInvitation | null> {
  if (!slugSchema.safeParse(slug).success) return null;
  const { data, error } = await createServiceClient()
    .from("invitations")
    .select("id, content, max_party_size")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const content = invitationContentSchema.safeParse(data.content);
  if (!content.success) return null;
  return { id: data.id, maxPartySize: data.max_party_size, deadline: content.data.rsvpDeadline };
}

// Edit tokens ----------------------------------------------------------------------

/** 24 random bytes, base64url: 32 characters. */
export const newEditToken = () => randomBytes(24).toString("base64url");
export const hashEditToken = (token: string) => createHash("sha256").update(token).digest("hex");

// Rate limiting --------------------------------------------------------------------

/**
 * Generous on purpose: when a link is posted in a group chat, many guests answer at once, and
 * mobile carriers put many phones behind one address.
 */
export const RSVP_RATE_LIMIT = { requests: 30, windowMs: 10 * 60_000 } as const;

/** Rate-limit key: a hash of the client IP and the slug, so neither is stored. */
export function rateLimitKey(ip: string, slug: string): string {
  return `rsvp:${createHash("sha256").update(`${ip}\n${slug}`).digest("hex")}`;
}

// Submitting -----------------------------------------------------------------------

export type SavedAnswer = { firstName: string; lastName: string; attending: boolean; partySize: number | null };

export type RsvpError = "invalid" | "not_found" | "closed" | "party_size" | "full" | "rate_limited" | "failed";

export type RsvpOutcome =
  | { ok: true; answer: SavedAnswer; /** Only for a new answer: the browser keeps it to change it later. */ editToken?: string }
  | { ok: false; error: RsvpError };

/**
 * Checks the deadline, party size and the response cap, then writes one answer. With an edit token
 * that matches an answer to this invitation, that answer changes; otherwise a new one is created
 * (also when the host has since deleted the old one).
 */
export async function submitRsvp(invitation: OpenInvitation, request: RsvpRequest, now: number): Promise<RsvpOutcome> {
  if (!rsvpOpen(invitation.deadline, now)) return { ok: false, error: "closed" };

  const partySize = request.attending ? request.partySize : null;
  if (partySize !== null && (partySize < 1 || partySize > invitation.maxPartySize)) return { ok: false, error: "party_size" };

  const answer: SavedAnswer = {
    firstName: request.firstName,
    lastName: request.lastName,
    attending: request.attending,
    partySize,
  };
  const row = { first_name: answer.firstName, last_name: answer.lastName, attending: answer.attending, party_size: partySize };
  const db = createServiceClient();

  if (request.editToken) {
    const { data, error } = await db
      .from("responses")
      .update(row)
      .eq("invitation_id", invitation.id)
      .eq("edit_token_hash", hashEditToken(request.editToken))
      .select("id");
    if (error) throw error;
    if (data.length > 0) return { ok: true, answer };
  }

  const { count, error: countError } = await db
    .from("responses")
    .select("id", { count: "exact", head: true })
    .eq("invitation_id", invitation.id);
  if (countError) throw countError;
  if ((count ?? 0) >= RESPONSE_LIMITS.perInvitation) return { ok: false, error: "full" };

  const editToken = newEditToken();
  const { error } = await db.from("responses").insert({ ...row, invitation_id: invitation.id, edit_token_hash: hashEditToken(editToken) });
  if (error) throw error;
  return { ok: true, answer, editToken };
}
