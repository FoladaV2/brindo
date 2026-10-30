"use server";

import { redirect } from "next/navigation";
import { flash } from "@/lib/flash";
import { createClient } from "@/lib/supabase/server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  await flash("signedOut");
  redirect("/login");
}
