"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type MagicLinkState =
  | { status: "idle" }
  | { status: "error"; error: "invalidEmail" | "rateLimited" | "failed"; email: string }
  | { status: "sent"; email: string };

const emailSchema = z.email().max(254);

export async function requestMagicLink(_prev: MagicLinkState, formData: FormData): Promise<MagicLinkState> {
  const raw = String(formData.get("email") ?? "").trim().toLowerCase();
  const parsed = emailSchema.safeParse(raw);
  if (!parsed.success) return { status: "error", error: "invalidEmail", email: raw };

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: { emailRedirectTo: `${siteUrl}/auth/callback`, shouldCreateUser: true },
  });

  if (error) {
    const rateLimited = error.status === 429 || error.code === "over_email_send_rate_limit";
    if (!rateLimited) console.error("signInWithOtp failed", error.code ?? error.status);
    return { status: "error", error: rateLimited ? "rateLimited" : "failed", email: parsed.data };
  }
  return { status: "sent", email: parsed.data };
}
