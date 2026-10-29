import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "./emails";

export type Admin = { id: string; email: string };

/**
 * The signed-in admin, or null. Asks the auth server (getUser), so a revoked session or a forged
 * cookie never passes, then checks the email against ADMIN_EMAILS.
 */
export async function currentAdmin(): Promise<Admin | null> {
  const { data } = await (await createClient()).auth.getUser();
  const user = data.user;
  if (!user?.email || !isAdminEmail(user.email, process.env.ADMIN_EMAILS)) return null;
  return { id: user.id, email: user.email };
}

/** For admin pages and actions: anyone else gets a plain 404, so the area isn't even visible. */
export async function requireAdmin(): Promise<Admin> {
  const admin = await currentAdmin();
  if (!admin) notFound();
  return admin;
}
