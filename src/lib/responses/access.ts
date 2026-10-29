import "server-only";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { HostResponse } from "./summary";

/** Answers to one of the host's invitations. RLS returns nothing for anyone else's invitation. */
export async function listResponses(invitationId: string): Promise<HostResponse[]> {
  if (!z.uuid().safeParse(invitationId).success) return [];
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("responses")
    .select("id, first_name, last_name, attending, party_size, created_at, updated_at")
    .eq("invitation_id", invitationId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    attending: row.attending,
    partySize: row.party_size,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

/** How many people are coming to each of the host's invitations, for the event list. */
export async function comingCounts(invitationIds: string[]): Promise<Map<string, { people: number; replies: number }>> {
  const counts = new Map<string, { people: number; replies: number }>();
  if (invitationIds.length === 0) return counts;
  const supabase = await createClient();
  const { data, error } = await supabase.from("responses").select("invitation_id, attending, party_size").in("invitation_id", invitationIds);
  if (error) throw error;
  for (const row of data) {
    const c = counts.get(row.invitation_id) ?? { people: 0, replies: 0 };
    c.replies += 1;
    if (row.attending) c.people += row.party_size ?? 1;
    counts.set(row.invitation_id, c);
  }
  return counts;
}
