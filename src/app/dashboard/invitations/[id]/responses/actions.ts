"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const uuid = z.uuid();

/**
 * Deletes one answer (a joke, a duplicate). Runs with the host's session: RLS lets a host delete
 * only answers to their own invitations, so a foreign id deletes nothing.
 */
export async function deleteResponse(invitationId: string, responseId: string): Promise<{ ok: boolean }> {
  if (!uuid.safeParse(invitationId).success || !uuid.safeParse(responseId).success) return { ok: false };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("responses")
    .delete()
    .eq("id", responseId)
    .eq("invitation_id", invitationId)
    .select("id");
  if (error) {
    console.error("delete response failed", error.code);
    return { ok: false };
  }
  return { ok: data.length === 1 };
}
