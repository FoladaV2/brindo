import { randomBytes, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type Client = SupabaseClient<Database>;
export type Couple = { id: string; email: string; client: Client };

const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };

const url = () => process.env.NEXT_PUBLIC_SUPABASE_URL!;

/** Service role: bypasses RLS. Used only to arrange and inspect test data, as server code would. */
export const admin = (): Client => createClient<Database>(url(), process.env.SUPABASE_SERVICE_ROLE_KEY!, options);

/** A visitor with no session, holding only the public anon key. */
export const anon = (): Client => createClient<Database>(url(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, options);

/** A real signed-in couple: an auth user plus an anon-key client carrying their session. */
export async function createCouple(label: string): Promise<Couple> {
  const email = `${label}-${randomUUID()}@example.com`;
  const password = randomBytes(18).toString("base64url");
  const created = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (created.error) throw created.error;

  const client = anon();
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error) throw signedIn.error;
  return { id: created.data.user.id, email, client };
}

/** Deleting the auth user cascades to their invitations, answers and onboarding. */
export async function deleteCouple(couple: Couple | undefined) {
  if (couple) await admin().auth.admin.deleteUser(couple.id);
}

export const uniqueSlug = (prefix = "t") => `${prefix}-${randomBytes(6).toString("hex")}`;

/** Returns the row or throws, so arrange steps fail loudly. */
export function must<T>(result: { data: T; error: unknown }): NonNullable<T> {
  if (result.error) throw result.error;
  if (result.data === null || result.data === undefined) throw new Error("expected a row");
  return result.data;
}

export const PERMISSION_DENIED = "42501";
