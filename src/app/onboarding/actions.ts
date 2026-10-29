"use server";

import { z } from "zod";
import { answersSchema } from "@/lib/onboarding/questions";
import { createClient } from "@/lib/supabase/server";

const inputSchema = z.object({ answers: answersSchema, skipped: z.boolean() });

/**
 * Saves the signed-in host's onboarding answers (or that they skipped). Written through the host's
 * own session, so RLS limits it to their row; the row id is their user id, never client-supplied.
 */
export async function saveOnboarding(input: unknown): Promise<{ ok: boolean }> {
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return { ok: false };

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) return { ok: false };

  const { error } = await supabase
    .from("onboarding")
    .upsert({ answers: parsed.data.answers, skipped: parsed.data.skipped }, { onConflict: "user_id" });
  if (error) {
    console.error("onboarding save failed", error.code);
    return { ok: false };
  }
  return { ok: true };
}
