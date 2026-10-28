"use client";

import { useActionState } from "react";
import { copy } from "@content/copy.ka";
import { AuthIntro, AuthSwitch } from "@/components/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
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

/** Email, password, password again. Success signs the couple in and opens the dashboard. */
export function RegisterPanel() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(register, { error: null, email: "" });
  const message = state.error && fill(t.errors[state.error], { n: PASSWORD_MIN });
  const at = state.error ? FIELD[state.error] : undefined;
  const fieldError = (field: "email" | "password" | "confirm") => (at === field && message) || undefined;

  return (
    <section className="flex flex-col items-center text-center">
      <AuthIntro label={t.register.label} heading={t.register.heading} lead={t.register.lead} />

      <form action={formAction} noValidate className="mt-12 flex w-full flex-col gap-4 text-start">
        <Input
          label={t.register.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email}
          error={fieldError("email")}
        />
        <Input
          label={t.register.password}
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={PASSWORD_MIN}
          required
          hint={fill(t.register.passwordHint, { n: PASSWORD_MIN })}
          error={fieldError("password")}
        />
        <Input label={t.register.confirm} name="confirm" type="password" autoComplete="new-password" required error={fieldError("confirm")} />
        <p role="alert" className="text-small text-error empty:hidden">
          {!at && message}
        </p>
        <Button type="submit" loading={pending} className="mt-6 w-full">
          {t.register.submit}
        </Button>
      </form>

      <AuthSwitch question={t.register.haveAccount} href="/login" action={t.register.login} />
    </section>
  );
}
