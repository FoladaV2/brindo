"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { copy } from "@content/copy.ka";
import { AuthIntro, AuthSwitch } from "@/components/legacy/AuthShell";
import { Button } from "@/components/legacy/Button";
import { Input } from "@/components/legacy/Field";
import type { AuthFormState } from "@/lib/auth/credentials";
import { signIn } from "./actions";

const t = copy.auth;

/** Email and password. Success redirects to the dashboard; problems show under the field or the form. */
export function LoginPanel() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(signIn, { error: null, email: "" });
  const emailError = state.error === "invalidEmail" ? t.errors.invalidEmail : undefined;
  const formError = state.error && state.error !== "invalidEmail" ? t.errors[state.error] : null;

  return (
    <section className="flex flex-col items-center text-center">
      <AuthIntro label={t.login.label} heading={t.login.heading} lead={t.login.lead} />

      <Suspense>
        <LinkError />
      </Suspense>

      <form action={formAction} noValidate className="mt-12 flex w-full flex-col gap-4 text-start">
        <Input
          label={t.login.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={state.email}
          error={emailError}
        />
        <Input label={t.login.password} name="password" type="password" autoComplete="current-password" required />
        <p role="alert" className="text-small text-error empty:hidden">
          {formError}
        </p>
        <Button type="submit" loading={pending} className="mt-6 w-full">
          {t.login.submit}
        </Button>
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
    <p role="alert" className="mt-8 max-w-[34ch] text-small text-error">
      {t.errors.link}
    </p>
  );
}
