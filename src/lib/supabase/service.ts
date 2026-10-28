import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

/**
 * Service-role client. Bypasses RLS: use only in server code that has already decided the caller
 * may do this (RSVP with a valid token, verified payment webhooks, public reads of published
 * invitations). Never import from a Client Component.
 */
export function createServiceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("Missing environment variable SUPABASE_SERVICE_ROLE_KEY. See .env.example.");
  return createClient<Database>(supabaseUrl(), key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
