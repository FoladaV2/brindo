"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { copy } from "@content/copy.ka";
import { AuthHeading, AuthSwitch } from "@/components/auth/auth-shell";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { SubmitButton } from "@/components/ui/submit-button";
import type { AuthFormState } from "@/lib/auth/credentials";
import { signIn } from "./actions";

const t = copy.auth;

/** Email and password. Success redirects to the dashboard; problems show under the field or the form. */
export function LoginPanel() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(signIn, { error: null, email: "" });
  const emailError = state.error === "invalidEmail" ? t.errors.invalidEmail : undefined;
  const formError = state.error && state.error !== "invalidEmail" ? t.errors[state.error] : null;

  return (
    <section>
      <AuthHeading heading={t.login.heading} lead={t.login.lead} />

      <Suspense>
        <LinkError />
      </Suspense>

      <form action={formAction} noValidate className="mt-10 grid gap-5">
        <Field id="email" label={t.login.email} error={emailError}>
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
        <Field id="password" label={t.login.password}>
          {(control) => <PasswordInput {...control} name="password" autoComplete="current-password" required />}
        </Field>
        <FormError message={formError} />
        <SubmitButton pending={pending} size="lg" className="mt-2 w-full">
          {t.login.submit}
        </SubmitButton>
      </form>

      <AuthSwitch question={t.login.noAccount} href="/register" action={t.login.register} />
    </section>
  );
}

/** Shown when the auth callback rejected an expired or already-used link (?error=link). */
function LinkError() {
  const params = useSearchParams();
  if (params.get("error") !== "link") return null;
  return (
    <div className="mt-8">
      <FormError message={t.errors.link} />
    </div>
  );
}
