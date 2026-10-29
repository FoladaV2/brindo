"use client";

import { useEffect, useRef, useState, type ComponentType, type FormEvent } from "react";
import type { Copy } from "@content/copy.ka";
import { Label } from "@/templates/ui/Label";
import { Stepper } from "@/templates/ui/Stepper";
import { fill } from "@/lib/text";
import type { InvitationGuest } from "../types";
import type { ToastProps } from "./Toast";

type Strings = Copy["invitation"]["rsvp"];
type Answer = "yes" | "no";
type Saved = { attending: boolean; partySize: number };
type ErrorKey = keyof Strings["errors"];

type RsvpFormProps = {
  strings: Strings;
  /** copy.ui: stepper button names and the loading label. */
  uiLabels: Copy["ui"];
  guest: InvitationGuest;
};

/** How long the preview's demo mode pretends the server takes. */
const DEMO_DELAY = 700;

const SERVER_ERRORS: Record<string, ErrorKey> = {
  rate_limited: "rateLimited",
  not_found: "notFound",
  closed: "closed",
  party_size: "partySize",
};

type SendResult = { ok: true; rsvp: Saved } | { ok: false; error: ErrorKey };

async function send(submit: InvitationGuest["submit"], answer: Saved): Promise<SendResult> {
  if (submit === "demo") {
    await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY));
    return { ok: true, rsvp: answer };
  }
  let response: Response;
  try {
    response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: submit.slug, token: submit.token, ...answer }),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  const body = await response.json().catch(() => null);
  if (response.ok && body?.ok) return { ok: true, rsvp: { attending: Boolean(body.rsvp.attending), partySize: Number(body.rsvp.partySize) } };
  return { ok: false, error: SERVER_ERRORS[body?.error] ?? "failed" };
}

/**
 * Yes or No, party size for a Yes, and submit. Success shows only once the server confirms; a Yes
 * then plays The Toast, loaded on demand so it adds nothing to the page until someone accepts.
 * Strings arrive as props and the submit uses the .btn classes rather than <Button>, so this client
 * component never imports content/copy.ka.ts and the invitation page doesn't download the whole file.
 */
export function RsvpForm({ strings, uiLabels, guest }: RsvpFormProps) {
  const [saved, setSaved] = useState<Saved | null>(guest.rsvp);
  const [editing, setEditing] = useState(guest.rsvp === null);
  /** Answered during this visit: show the thank-you line and fade in. */
  const [fresh, setFresh] = useState(false);
  const [answer, setAnswer] = useState<Answer | null>(guest.rsvp ? (guest.rsvp.attending ? "yes" : "no") : null);
  const [partySize, setPartySize] = useState(guest.rsvp?.attending ? guest.rsvp.partySize : guest.maxPartySize);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [Toast, setToast] = useState<ComponentType<ToastProps> | null>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const focusSaved = useRef(false);

  // After an answer (and after The Toast closes), move focus to the saved answer so it is announced.
  useEffect(() => {
    if (!editing && !Toast && focusSaved.current) {
      focusSaved.current = false;
      savedRef.current?.focus();
    }
  }, [editing, Toast]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!answer || busy) return;
    const attending = answer === "yes";
    // Fetch The Toast alongside the request, so it is ready the moment the server confirms.
    const toast = attending ? import("./Toast").catch(() => null) : null;
    setBusy(true);
    setError(null);
    const result = await send(guest.submit, { attending, partySize: attending ? partySize : 0 });
    if (!result.ok) {
      setBusy(false);
      setError(result.error);
      return;
    }
    const loaded = toast && (await toast);
    setBusy(false);
    setSaved(result.rsvp);
    setFresh(true);
    setEditing(false);
    focusSaved.current = true;
    if (loaded) setToast(() => loaded.Toast);
  };

  if (!editing && saved) {
    return (
      <>
        <div ref={savedRef} tabIndex={-1} className="rsvp-saved" data-fresh={fresh || undefined}>
          <Label>{strings.yourAnswer}</Label>
          <p className="mt-4 font-display text-h2">{saved.attending ? strings.yes : strings.no}</p>
          {saved.attending && <p className="mt-2 text-body text-fg-muted tabular-nums">{fill(strings.partyCount, { n: saved.partySize })}</p>}
          {fresh && <p className="mt-8 max-w-[30ch] text-body text-balance">{saved.attending ? strings.thanksYes : strings.thanksNo}</p>}
          {guest.closed ? (
            <p className="mt-10 text-small text-fg-muted">{strings.closed}</p>
          ) : (
            <>
              <button
                type="button"
                className="rsvp-change mt-10"
                onClick={() => {
                  setEditing(true);
                  setFresh(false);
                  setError(null);
                }}
              >
                {strings.change}
              </button>
              <p className="mt-1 text-small text-fg-muted">{strings.changeHint}</p>
            </>
          )}
        </div>
        {Toast && <Toast name={guest.name} strings={strings.toast} onDone={() => setToast(null)} />}
      </>
    );
  }

  if (guest.closed) {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="font-display text-h3">{strings.closed}</p>
        <p className="max-w-[30ch] text-body text-fg-muted">{strings.closedHint}</p>
      </div>
    );
  }

  const choices = [
    { value: "yes", title: strings.yes, hint: strings.yesHint },
    { value: "no", title: strings.no, hint: strings.noHint },
  ] as const;

  return (
    <form onSubmit={onSubmit} className="rsvp-form flex w-full flex-col items-center" aria-busy={busy || undefined}>
      <fieldset className="inv-choices w-full" disabled={busy}>
        <legend className="sr-only">{strings.title}</legend>
        {choices.map((c) => (
          <label key={c.value} className="inv-choice">
            <input
              type="radio"
              name="attending"
              value={c.value}
              checked={answer === c.value}
              onChange={() => {
                setAnswer(c.value);
                setError(null);
              }}
              className="sr-only"
            />
            <span className="inv-choice-mark" aria-hidden />
            <span className="font-display text-h3">{c.title}</span>
            <span className="inv-choice-hint text-small">{c.hint}</span>
          </label>
        ))}
      </fieldset>

      {answer === "yes" && guest.maxPartySize > 1 && (
        <div className="rise-in mt-12 flex flex-col items-center gap-2">
          <Stepper
            label={strings.partySize}
            buttonLabels={uiLabels}
            name="partySize"
            min={1}
            max={guest.maxPartySize}
            value={partySize}
            onChange={setPartySize}
          />
          <p className="text-small text-fg-muted">{strings.partySizeHint}</p>
        </div>
      )}

      <button type="submit" disabled={!answer || busy} aria-busy={busy || undefined} className="btn btn-primary mt-12 w-full max-w-[20rem]">
        <span className="btn-label">{strings.submit}</span>
        {busy && (
          <>
            <span className="btn-spinner" aria-hidden />
            <span className="sr-only">{uiLabels.loading}</span>
          </>
        )}
      </button>

      <p role="alert" className="rsvp-error max-w-[32ch] text-small text-error">
        {error && fill(strings.errors[error], { n: guest.maxPartySize })}
      </p>
    </form>
  );
}
