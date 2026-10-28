import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import type { Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase settings for e2e tests: .env.local (a hosted dev project) or the local stack from
 * `supabase status`. Null when neither is available, so database tests can skip with a reason.
 */
function supabaseEnv() {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { url: process.env.NEXT_PUBLIC_SUPABASE_URL, serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY };
  }
  try {
    const out = execSync("supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const read = (key: string) => out.match(new RegExp(`^${key}="?(.*?)"?$`, "m"))?.[1];
    const url = read("API_URL");
    const serviceKey = read("SERVICE_ROLE_KEY");
    return url && serviceKey ? { url, serviceKey } : null;
  } catch {
    return null;
  }
}

export const supabase = supabaseEnv();
export const NO_SUPABASE = "No Supabase configured: fill in .env.local or run `supabase start` and `supabase db reset`.";

/** Seed couples (supabase/seed.sql). */
export const SEED = {
  nino: { email: "nino.giorgi@example.com", draftSlug: "nino-da-giorgi-k7xq", draftId: "a1000000-0000-4000-8000-0000000000a1" },
  ana: { email: "ana.luka@example.com", publishedSlug: "ana-da-luka-m3pd" },
};

/** Signs in through the app's own magic-link callback, with a link minted by the admin API (no inbox needed). */
export async function signIn(page: Page, email: string) {
  if (!supabase) throw new Error(NO_SUPABASE);
  const admin = createClient(supabase.url, supabase.serviceKey, { auth: { persistSession: false } });
  const { data, error } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (error) throw error;
  await page.goto(`/auth/callback?token_hash=${data.properties.hashed_token}&type=magiclink`);
  await page.waitForURL("**/dashboard");
}
