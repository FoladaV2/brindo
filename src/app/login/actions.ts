"use server";

import { redirect } from "next/navigation";
import { signInSchema, type AuthFormState } from "@/lib/auth/credentials";
import { allowSignIn } from "@/lib/auth/limits";
import { createClient } from "@/lib/supabase/server";

/** Email and password. Success sets the session cookies and goes to the dashboard. */
export async function signIn(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = { email: String(formData.get("email") ?? ""), password: String(formData.get("password") ?? "") };
  const parsed = signInSchema.safeParse(raw);
  const email = raw.email.trim().toLowerCase();
  if (!parsed.success) return { error: parsed.error.issues[0]?.path[0] === "email" ? "invalidEmail" : "invalidCredentials", email };
  if (!(await allowSignIn(parsed.data.email))) return { error: "rateLimited", email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.status === 429) return { error: "rateLimited", email };
    // Wrong password, unknown email, or an account made by magic link that has no password: one answer.
    if (error.code === "invalid_credentials" || error.status === 400) return { error: "invalidCredentials", email };
    console.error("signInWithPassword failed", error.code ?? error.status);
    return { error: "failed", email };
  }
  redirect("/dashboard");
}
