"use client";

import { Suspense, useActionState, useState, type CSSProperties } from "react";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import { requestMagicLink, type MagicLinkState } from "./actions";

const t = copy.auth;

// Moves focus to the "check your inbox" heading so screen readers announce the new state.
const focusOnMount = (el: HTMLElement | null) => el?.focus();

/** Email form, then a "check your inbox" state in the same place. */
export function LoginPanel() {
  const [state, formAction, pending] = useActionState<MagicLinkState, FormData>(requestMagicLink, { status: "idle" });
  // "Use another email" returns to the form; the next submit clears it inside the action's transition.
  const [editing, setEditing] = useState(false);

  if (state.status === "sent" && !editing) {
    return (
      <section className="flex flex-col items-center text-center">
        <span className="rise-in flex size-16 items-center justify-center rounded-pill border border-hairline text-accent-fg">
          <MailCheck aria-hidden size={26} strokeWidth={1.25} />
        </span>
        <div className="rise-in mt-10 flex items-center gap-4" style={{ "--i": 1 } as CSSProperties}>
          <span aria-hidden className="h-px w-10 bg-accent" />
          <Label>{t.sent.label}</Label>
          <span aria-hidden className="h-px w-10 bg-accent" />
        </div>
        <h1
          ref={focusOnMount}
          tabIndex={-1}
          className="rise-in mt-6 font-display text-h2 outline-none"
          style={{ "--i": 2 } as CSSProperties}
        >
          {t.sent.heading}
        </h1>
        <p className="rise-in mt-6 text-body text-fg-muted" style={{ "--i": 3 } as CSSProperties}>
          {t.sent.body}
          <br />
          <span className="break-all text-fg">{state.email}</span>
        </p>
        <p className="rise-in mt-6 max-w-[34ch] text-small text-fg-muted" style={{ "--i": 4 } as CSSProperties}>
          {t.sent.hint}
        </p>
        <div className="rise-in mt-12 w-full" style={{ "--i": 5 } as CSSProperties}>
          <Button variant="secondary" className="w-full" onClick={() => setEditing(true)}>
            {t.sent.retry}
          </Button>
        </div>
      </section>
    );
  }

  const error = state.status === "error" ? t.errors[state.error] : undefined;
  const defaultEmail = state.status === "idle" ? "" : state.email;

  return (
    <section className="flex flex-col items-center text-center">
      <div className="flex items-center gap-4">
        <span aria-hidden className="h-px w-10 bg-accent" />
        <Label>{t.login.label}</Label>
        <span aria-hidden className="h-px w-10 bg-accent" />
      </div>
      <h1 className="mt-6 max-w-[16ch] font-display text-h2">{t.login.heading}</h1>
      <p className="mt-6 max-w-[34ch] text-body text-fg-muted">{t.login.lead}</p>

      <Suspense>
        <LinkError />
      </Suspense>

      <form
        action={(formData) => {
          setEditing(false);
          formAction(formData);
        }}
        noValidate
        className="mt-12 flex w-full flex-col gap-10 text-start"
      >
        <Input
          label={t.login.email}
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          required
          defaultValue={defaultEmail}
          error={error}
        />
        <Button type="submit" loading={pending} className="w-full">
          {t.login.submit}
        </Button>
      </form>
    </section>
  );
}

/** Shown when the callback rejected an expired or already-used link (?error=link). */
function LinkError() {
  const params = useSearchParams();
  if (params.get("error") !== "link") return null;
  return (
    <p role="alert" className="mt-8 max-w-[34ch] text-small text-error">
      {t.errors.link}
    </p>
  );
}
