import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/**
 * Whether a host may publish without paying (granted in /admin). Any failure (no row, no table yet,
 * no network) answers false, so the worst case is the normal Pay button, never a free publish.
 */
export async function hasUnlimitedAccess(userId: string): Promise<boolean> {
  try {
    const { data, error } = await createServiceClient().from("entitlements").select("user_id").eq("user_id", userId).maybeSingle();
    return !error && data !== null;
  } catch {
    return false;
  }
}
