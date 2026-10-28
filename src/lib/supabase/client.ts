import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/** Browser client for Client Components. Uses the anon key and the signed-in couple's session. */
export function createClient() {
  return createBrowserClient<Database>(supabaseUrl(), supabaseAnonKey());
}
