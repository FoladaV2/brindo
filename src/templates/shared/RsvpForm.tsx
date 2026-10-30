"use client";

import { useEffect, useRef, useState, type ComponentType, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { Copy } from "@content/copy.ka";
import { Input } from "@/templates/ui/Field";
import { Label } from "@/templates/ui/Label";
import { Stepper } from "@/templates/ui/Stepper";
import { fill } from "@/lib/text";
import type { InvitationRsvp } from "../types";
import { storageKey, useStoredAnswer, writeStored, type Answer } from "./rsvp-storage";
import type { ToastProps } from "./Toast";

type Strings = Copy["invitation"]["rsvp"];
type ErrorKey = keyof Strings["errors"];

type RsvpFormProps = {
  strings: Strings;
  /** copy.ui: stepper button names and the loading label. */
  uiLabels: Copy["ui"];
  rsvp: InvitationRsvp;
};

/** How long the preview's demo mode pretends the server takes. */
const DEMO_DELAY = 700;

const SERVER_ERRORS: Record<string, ErrorKey> = {
  rate_limited: "rateLimited",
  not_found: "notFound",
  closed: "closed",
  party_size: "partySize",
  full: "full",
  invalid: "invalid",
};

type SendResult = { ok: true; answer: Answer; editToken?: string } | { ok: false; error: ErrorKey };

async function send(rsvp: InvitationRsvp, answer: Answer, editToken: string | null): Promise<SendResult> {
  if (rsvp.submit === "demo") {
    await new Promise((resolve) => setTimeout(resolve, DEMO_DELAY));
    return { ok: true, answer };
  }
  let response: Response;
  try {
    response = await fetch("/api/rsvp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: rsvp.slug, ...answer, ...(editToken ? { editToken } : {}) }),
    });
  } catch {
    return { ok: false, error: "network" };
  }
  const body = await response.json().catch(() => null);
  if (response.ok && body?.ok) return { ok: true, answer: body.answer as Answer, editToken: body.editToken };
  return { ok: false, error: SERVER_ERRORS[body?.error] ?? "failed" };
}

/**
 * First name, surname, how many people in total, and two buttons: coming, not coming. Success shows
 * only once the server confirms; "coming" then plays The Toast, loaded on demand. Strings arrive as
 * props and buttons use the .btn classes, so this client component never imports content/copy.ka.ts
 * and the invitation page doesn't download the whole file.
 */
export function RsvpForm({ strings, uiLabels, rsvp }: RsvpFormProps) {
  const router = useRouter();
  const key = storageKey(rsvp);
  const { stored } = useStoredAnswer(key);

  const [editing, setEditing] = useState(false);
  /** Answered during this visit: show the thank-you line. */
  const [fresh, setFresh] = useState(false);
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);
  const [error, setError] = useState<ErrorKey | null>(null);
  const [missing, setMissing] = useState<{ first: boolean; last: boolean }>({ first: false, last: false });
  const [partySize, setPartySize] = useState<number | null>(null);
  const [Toast, setToast] = useState<ComponentType<ToastProps> | null>(null);
  const savedRef = useRef<HTMLDivElement>(null);
  const focusSaved = useRef(false);

  const showSaved = stored !== null && !editing;
  const size = partySize ?? stored?.answer.partySize ?? 1;

  // After an answer (and after The Toast closes), move focus to the saved answer so it is announced.
  useEffect(() => {
    if (showSaved && !Toast && focusSaved.current) {
      focusSaved.current = false;
      savedRef.current?.focus();
    }
  }, [showSaved, Toast]);

  /** "Coming" goes through The Toast first; "not coming" comes straight here. */
  const toThanks = () => {
    if (rsvp.thanksHref) router.push(rsvp.thanksHref);
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy) return;
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const attending = submitter?.value !== "no";
    const data = new FormData(event.currentTarget);
    const firstName = String(data.get("firstName") ?? "").trim();
    const lastName = String(data.get("lastName") ?? "").trim();
    const nextMissing = { first: !firstName, last: !lastName };
    setMissing(nextMissing);
    if (nextMissing.first || nextMissing.last) {
      setError(null);
      event.currentTarget.querySelector<HTMLInputElement>(nextMissing.first ? "[name=firstName]" : "[name=lastName]")?.focus();
      return;
    }

    // Fetch The Toast alongside the request, so it is ready the moment the server confirms.
    const toast = attending ? import("./Toast").catch(() => null) : null;
    setBusy(attending ? "yes" : "no");
    setError(null);
    const answer: Answer = { firstName, lastName, attending, partySize: attending ? size : null };
    const result = await send(rsvp, answer, stored?.token ?? null);
    if (!result.ok) {
      setBusy(null);
      setError(result.error);
      return;
    }
    const loaded = toast && (await toast);
    setBusy(null);
    writeStored(key, { token: result.editToken ?? stored?.token ?? null, answer: result.answer });
    setFresh(true);
    setEditing(false);
    setPartySize(null);
    focusSaved.current = true;
    if (loaded) setToast(() => loaded.Toast);
    else toThanks();
  };

  if (showSaved) {
    const saved = stored.answer;
    return (
      <>
        <div ref={savedRef} tabIndex={-1} className="rsvp-saved" data-fresh={fresh || undefined}>
          <Label>{strings.yourAnswer}</Label>
          <p className="mt-3 text-small text-fg-muted">
            {saved.firstName} {saved.lastName}
          </p>
          <p className="mt-1 font-display text-h2">{saved.attending ? strings.yes : strings.no}</p>
          {saved.attending && saved.partySize ? (
            <p className="mt-1 text-small text-fg-muted tabular-nums">{fill(strings.partyCount, { n: saved.partySize })}</p>
          ) : null}
          {fresh && <p className="mt-5 max-w-[34ch] text-body text-balance">{saved.attending ? strings.thanksYes : strings.thanksNo}</p>}
          {rsvp.closed ? (
            <p className="mt-6 text-small text-fg-muted">{strings.closed}</p>
          ) : (
            <>
              <button
                type="button"
                className="rsvp-change mt-5"
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
        {Toast && (
          <Toast
            name={saved.firstName}
            strings={strings.toast}
            onDone={() => {
              setToast(null);
              toThanks();
            }}
          />
        )}
      </>
    );
  }

  if (rsvp.closed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2 text-center">
        <p className="font-display text-fact">{strings.closed}</p>
        <p className="max-w-[30ch] text-body text-fg-muted">{strings.closedHint}</p>
      </div>
    );
  }

  const previous = editing ? stored?.answer : undefined;

  return (
    <form onSubmit={onSubmit} noValidate className="rsvp-form flex w-full flex-col" aria-busy={busy ? true : undefined}>
      {/* Names, then the party size; in a wide card all three share one row. */}
      <div className="rsvp-row">
        <fieldset className="grid w-full grid-cols-2 gap-x-4 sm:gap-x-6" disabled={busy !== null}>
          <legend className="sr-only">{strings.title}</legend>
          <Input
            label={strings.firstName}
            name="firstName"
            autoComplete="given-name"
            maxLength={40}
            defaultValue={previous?.firstName}
            error={missing.first ? strings.errors.firstName : undefined}
            onInput={() => missing.first && setMissing((m) => ({ ...m, first: false }))}
          />
          <Input
            label={strings.lastName}
            name="lastName"
            autoComplete="family-name"
            maxLength={60}
            defaultValue={previous?.lastName}
            error={missing.last ? strings.errors.lastName : undefined}
            onInput={() => missing.last && setMissing((m) => ({ ...m, last: false }))}
          />
        </fieldset>
        {rsvp.maxPartySize > 1 && (
          <Stepper
            align="row"
            label={strings.partySize}
            hint={strings.partySizeHint}
            buttonLabels={uiLabels}
            name="partySize"
            min={1}
            max={rsvp.maxPartySize}
            value={Math.min(size, rsvp.maxPartySize)}
            onChange={setPartySize}
          />
        )}
      </div>

      <div className="rsvp-buttons mt-5 w-full">
        <RsvpButton value="yes" label={strings.yes} busy={busy} loadingLabel={uiLabels.loading} primary />
        <RsvpButton value="no" label={strings.no} busy={busy} loadingLabel={uiLabels.loading} />
      </div>

      <p role="alert" className="rsvp-error text-center text-small text-error">
        {error && fill(strings.errors[error], { n: rsvp.maxPartySize })}
      </p>
    </form>
  );
}

function RsvpButton({
  value,
  label,
  busy,
  loadingLabel,
  primary = false,
}: {
  value: "yes" | "no";
  label: string;
  busy: "yes" | "no" | null;
  loadingLabel: string;
  primary?: boolean;
}) {
  const mine = busy === value;
  return (
    <button
      type="submit"
      name="attending"
      value={value}
      disabled={busy !== null}
      aria-busy={mine || undefined}
      className={primary ? "btn btn-primary w-full" : "btn btn-secondary w-full"}
    >
      <span className="btn-label">{label}</span>
      {mine && (
        <>
          <span className="btn-spinner" aria-hidden />
          <span className="sr-only">{loadingLabel}</span>
        </>
      )}
    </button>
  );
}
