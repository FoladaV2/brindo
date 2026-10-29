"use client";

import { useActionState } from "react";
import { copy } from "@content/copy.ka";
import { AuthHeading, AuthSwitch } from "@/components/auth/auth-shell";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import { PASSWORD_MIN, type AuthFormState, type CredentialError } from "@/lib/auth/credentials";
import { fill } from "@/lib/text";
import { register } from "./actions";

const t = copy.auth;

/** Which field shows an error; anything else shows above the button. */
const FIELD: Partial<Record<CredentialError, "email" | "password" | "confirm">> = {
  invalidEmail: "email",
  passwordShort: "password",
  passwordLong: "password",
  weakPassword: "password",
  passwordMismatch: "confirm",
};

/** Email, password, password again. Success signs the host in and opens onboarding. */
export function RegisterPanel() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(register, { error: null, email: "" });
  const message = state.error && fill(t.errors[state.error], { n: PASSWORD_MIN });
  const at = state.error ? FIELD[state.error] : undefined;
  const fieldError = (field: "email" | "password" | "confirm") => (at === field && message) || undefined;

  return (
    <section>
      <AuthHeading heading={t.register.heading} lead={t.register.lead} />

      <form action={formAction} noValidate className="mt-10 grid gap-5">
        <Field id="email" label={t.register.email} error={fieldError("email")}>
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              required
              defaultValue={state.email}
            />
          )}
        </Field>
        <Field id="password" label={t.register.password} hint={fill(t.register.passwordHint, { n: PASSWORD_MIN })} error={fieldError("password")}>
          {(control) => <PasswordInput {...control} name="password" autoComplete="new-password" minLength={PASSWORD_MIN} required />}
        </Field>
        <Field id="confirm" label={t.register.confirm} error={fieldError("confirm")}>
          {(control) => <PasswordInput {...control} name="confirm" autoComplete="new-password" required />}
        </Field>
        <FormError message={at ? null : message} />
        <SubmitButton pending={pending} size="lg" className="mt-2 w-full">
          {t.register.submit}
        </SubmitButton>
        <p className="text-center text-sm text-muted-foreground">{t.register.terms}</p>
      </form>

      <AuthSwitch question={t.register.haveAccount} href="/login" action={t.register.login} />
    </section>
  );
}
