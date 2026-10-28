import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

/**
 * The couple's read-only view of who is coming. Reads go through the couple's own session, so RLS
 * returns only their guests and those guests' answers; couples have no write access to RSVPs at all.
 */

export type GuestStatus = "confirmed" | "declined" | "awaiting";

export type OverviewGuest = {
  id: string;
  name: string;
  maxPartySize: number;
  token: string;
  status: GuestStatus;
  /** People this guest confirmed, themselves included. 0 unless confirmed. */
  partySize: number;
};

export type OverviewSummary = {
  invited: number;
  confirmed: number;
  /** Everyone coming: the confirmed guests' party sizes added up. */
  headcount: number;
  declined: number;
  awaiting: number;
};

type Row = {
  id: string;
  name: string;
  max_party_size: number;
  token: string;
  rsvps: { attending: boolean; party_size: number } | null;
};

export function toOverviewGuest(row: Row): OverviewGuest {
  const status: GuestStatus = !row.rsvps ? "awaiting" : row.rsvps.attending ? "confirmed" : "declined";
  return {
    id: row.id,
    name: row.name,
    maxPartySize: row.max_party_size,
    token: row.token,
    status,
    partySize: status === "confirmed" ? row.rsvps!.party_size : 0,
  };
}

/** Guests of one invitation with their answers, in the order they were added. */
export async function fetchGuestOverview(client: SupabaseClient<Database>, invitationId: string): Promise<OverviewGuest[]> {
  const { data, error } = await client
    .from("guests")
    .select("id, name, max_party_size, token, rsvps(attending, party_size)")
    .eq("invitation_id", invitationId)
    .order("created_at")
    .order("id");
  if (error) throw error;
  return data.map(toOverviewGuest);
}

export function summarize(guests: OverviewGuest[]): OverviewSummary {
  const summary: OverviewSummary = { invited: guests.length, confirmed: 0, headcount: 0, declined: 0, awaiting: 0 };
  for (const guest of guests) {
    summary[guest.status]++;
    summary.headcount += guest.partySize;
  }
  return summary;
}

/** The reminder as pasted into Viber: the couple's message, then the guest's personal link on its own line. */
export function reminderText(message: string, link: string): string {
  const text = message.trim();
  return text ? `${text}\n${link}` : link;
}
