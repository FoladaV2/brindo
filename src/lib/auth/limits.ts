import "server-only";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { clientIp, hitRateLimit, type RateLimit } from "@/lib/rate-limit";

/**
 * Sign-in and registration run in server actions, so Supabase Auth sees our server's address, not
 * the visitor's: its own per-IP limits would be shared by every visitor and can't stop password
 * guessing. These limits are per visitor, in our database. Keys are hashes: no IPs or emails stored.
 */

/** Guesses at one account from one address. */
const SIGN_IN_PER_ACCOUNT: RateLimit = { requests: 10, windowMs: 15 * 60_000 };
/** All sign-in attempts from one address, across accounts. */
const SIGN_IN_PER_IP: RateLimit = { requests: 30, windowMs: 15 * 60_000 };
/** New accounts from one address. */
const REGISTER_PER_IP: RateLimit = { requests: 5, windowMs: 60 * 60_000 };

const key = (...parts: string[]) => createHash("sha256").update(parts.join("\n")).digest("hex");

/** Counts a sign-in attempt. True if it may go ahead. */
export async function allowSignIn(email: string): Promise<boolean> {
  const ip = clientIp(await headers());
  const now = Date.now();
  const [account, address] = await Promise.all([
    hitRateLimit(`signin:${key(ip, email)}`, SIGN_IN_PER_ACCOUNT, now),
    hitRateLimit(`signin-ip:${key(ip)}`, SIGN_IN_PER_IP, now),
  ]);
  return account === null && address === null;
}

/** Counts a registration attempt. True if it may go ahead. */
export async function allowRegister(): Promise<boolean> {
  const ip = clientIp(await headers());
  return (await hitRateLimit(`register:${key(ip)}`, REGISTER_PER_IP, Date.now())) === null;
}
