import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Server client for Server Components, Server Actions and Route Handlers. Acts as the signed-in
 * couple (anon key + session cookie), so RLS applies. Create one per request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Server Components cannot set cookies. The proxy refreshes the session instead.
        }
      },
    },
  });
}
