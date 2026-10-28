import { z } from "zod";

/**
 * Email and password rules for registering and signing in. The server checks them; Supabase Auth
 * enforces the same minimum (minimum_password_length in supabase/config.toml and the hosted project).
 */

export const PASSWORD_MIN = 8;
/** bcrypt reads only the first 72 bytes; Georgian letters are 3 bytes each in UTF-8. */
export const PASSWORD_MAX_BYTES = 72;

export const emailSchema = z
  .string()
  .transform((s) => s.trim().toLowerCase())
  .pipe(z.email().max(254));

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, { error: "passwordShort" })
  .refine((s) => new TextEncoder().encode(s).length <= PASSWORD_MAX_BYTES, { error: "passwordLong" });

export const signInSchema = z.object({
  email: emailSchema,
  // Any non-empty password: an account's own password is the only rule that matters here.
  password: z.string().min(1).max(256),
});

export const registerSchema = z
  .object({ email: emailSchema, password: passwordSchema, confirm: z.string() })
  .refine((v) => v.password === v.confirm, { path: ["confirm"], error: "passwordMismatch" });

export type CredentialError =
  | "invalidEmail"
  | "passwordShort"
  | "passwordLong"
  | "passwordMismatch"
  | "invalidCredentials"
  | "userExists"
  | "weakPassword"
  | "rateLimited"
  | "failed";

/** The first problem with registration input, as a copy key, or null if it is valid. */
export function registerError(input: { email: string; password: string; confirm: string }): CredentialError | null {
  const result = registerSchema.safeParse(input);
  if (result.success) return null;
  const issue = result.error.issues[0];
  if (issue.path[0] === "email") return "invalidEmail";
  if (issue.message === "passwordLong" || issue.message === "passwordMismatch") return issue.message;
  return "passwordShort";
}

/** What the sign-in and register forms get back when an attempt fails (success redirects). */
export type AuthFormState = { error: CredentialError | null; email: string };
