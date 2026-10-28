"use server";

import { redirect } from "next/navigation";
import { registerError, registerSchema, type AuthFormState } from "@/lib/auth/credentials";
import { allowRegister } from "@/lib/auth/limits";
import { createClient } from "@/lib/supabase/server";

/**
 * Creates an account with email and password and signs the couple in straight away. Email
 * confirmation is off (supabase/config.toml, and "Confirm email" in the hosted project's settings),
 * so Supabase returns a session at once.
 */
export async function register(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const raw = {
    email: String(formData.get("email") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  };
  const email = raw.email.trim().toLowerCase();
  const invalid = registerError(raw);
  if (invalid) return { error: invalid, email };
  const { email: cleanEmail, password } = registerSchema.parse(raw);
  if (!(await allowRegister())) return { error: "rateLimited", email };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
  if (error) {
    if (error.code === "user_already_exists" || error.code === "email_exists") return { error: "userExists", email };
    if (error.code === "weak_password") return { error: "weakPassword", email };
    if (error.status === 429) return { error: "rateLimited", email };
    console.error("signUp failed", error.code ?? error.status);
    return { error: "failed", email };
  }
  if (!data.session) {
    // The project still asks for email confirmation: turn off "Confirm email" in Supabase Auth settings.
    console.error("signUp returned no session: email confirmation is still enabled in the Supabase project");
    return { error: "failed", email };
  }
  redirect("/dashboard");
}
