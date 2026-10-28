import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { fetchGuestOverview, type OverviewGuest } from "./overview";
import type { OwnGuest } from "./schema";

export type { OwnGuest };

export const GUEST_COLUMNS = "id, name, max_party_size, token";

export const toOwnGuest = (row: { id: string; name: string; max_party_size: number; token: string }): OwnGuest => ({
  id: row.id,
  name: row.name,
  maxPartySize: row.max_party_size,
  token: row.token,
});

/** Guests of one of the couple's invitations, in the order they were added. RLS returns no one else's. */
export async function listOwnGuests(invitationId: string): Promise<OwnGuest[]> {
  if (!z.uuid().safeParse(invitationId).success) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("guests")
    .select(GUEST_COLUMNS)
    .eq("invitation_id", invitationId)
    .order("created_at")
    .order("id");
  if (error) throw error;
  return data.map(toOwnGuest);
}

/** The couple's guests with their answers, read-only. RLS returns no one else's guests or RSVPs. */
export async function listGuestOverview(invitationId: string): Promise<OverviewGuest[]> {
  if (!z.uuid().safeParse(invitationId).success) return [];
  return fetchGuestOverview(await createClient(), invitationId);
}
