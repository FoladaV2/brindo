/** Public Supabase settings. Safe in the browser: access is enforced by RLS, not by hiding these. */
export function supabaseUrl(): string {
  return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function supabaseAnonKey(): string {
  return required("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

// Keep process.env.NEXT_PUBLIC_* as static property reads above: Next inlines only those in the browser bundle.
function required(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Missing environment variable ${name}. See .env.example.`);
  return value;
}
