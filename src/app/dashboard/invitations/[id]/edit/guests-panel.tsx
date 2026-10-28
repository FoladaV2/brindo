"use client";

import { useRef, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { Check, Copy, Link2, Pencil, Trash2 } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Field";
import { Stepper } from "@/components/ui/Stepper";
import { GUEST_LIMITS, guestLink, guestName, linksText, splitNameList, type OwnGuest } from "@/lib/guests/schema";
import { fill } from "@/lib/text";
import { addGuests, deleteGuest, updateGuest, type GuestResult } from "../../guest-actions";

const g = copy.editor.guests;
const COPIED_FOR = 2400;
const NAME_INPUT_ID = "add-guest-name";

type GuestsPanelProps = {
  invitationId: string;
  slug: string;
  siteUrl: string;
  published: boolean;
  guests: OwnGuest[];
  setGuests: Dispatch<SetStateAction<OwnGuest[]>>;
};

/** The editor's Guests tab: add (one or a pasted list), edit, delete, and copy personal links. */
export function GuestsPanel({ invitationId, slug, siteUrl, published, guests, setGuests }: GuestsPanelProps) {
  const [announcement, setAnnouncement] = useState("");
  const [allCopied, setAllCopied] = useState<"idle" | "copied" | "failed">("idle");
  const resetAll = useRef<ReturnType<typeof setTimeout>>(undefined);

  const copyAll = async () => {
    const ok = await copyText(linksText(siteUrl, slug, guests));
    setAllCopied(ok ? "copied" : "failed");
    setAnnouncement(ok ? g.list.copiedAll : g.list.copyFailed);
    clearTimeout(resetAll.current);
    resetAll.current = setTimeout(() => setAllCopied("idle"), COPIED_FOR);
  };

  return (
    <div className="flex flex-col gap-8">
      <AddGuests invitationId={invitationId} onAdded={(added) => setGuests((prev) => [...prev, ...added])} />

      <section className="editor-section" aria-labelledby="guest-list-title">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <h2 id="guest-list-title" className="font-display text-h3">
            {g.list.title}
          </h2>
          <span className="text-small text-fg-muted tabular-nums">{fill(g.list.count, { n: guests.length })}</span>
        </div>

        <div className="guest-note">
          <p className="text-small text-fg-muted">{g.list.note}</p>
          {!published && <p className="text-small text-accent-fg">{g.list.notPublished}</p>}
          <button type="button" className="btn btn-secondary self-start" onClick={copyAll} disabled={guests.length === 0}>
            <span className="btn-label">
              {allCopied === "copied" ? <Check size={18} strokeWidth={1.25} aria-hidden /> : <Copy size={18} strokeWidth={1.25} aria-hidden />}
              {allCopied === "copied" ? g.list.copiedAll : g.list.copyAll}
            </span>
          </button>
          {allCopied === "failed" && <p className="text-small text-error">{g.list.copyFailed}</p>}
        </div>

        {guests.length === 0 ? (
          <p className="text-small text-fg-muted">{g.list.empty}</p>
        ) : (
          <ul className="guest-list">
            {guests.map((guest) => (
              <GuestRow
                key={guest.id}
                guest={guest}
                link={guestLink(siteUrl, slug, guest.token)}
                onAnnounce={setAnnouncement}
                onSaved={(saved) => setGuests((prev) => prev.map((x) => (x.id === saved.id ? saved : x)))}
                onDeleted={() => setGuests((prev) => prev.filter((x) => x.id !== guest.id))}
              />
            ))}
          </ul>
        )}
      </section>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

/** The error to show for a guest name, matching what the server accepts. */
function nameError(value: string): string | undefined {
  const result = guestName.safeParse(value);
  if (result.success) return undefined;
  const code = result.error.issues[0]?.code;
  if (code === "too_small") return g.errors.required;
  if (code === "too_big") return g.errors.tooLong;
  return g.errors.name;
}

function resultError(result: GuestResult<unknown>): string {
  if (result.ok) return "";
  if (result.reason === "belowRsvp") return fill(g.errors.belowRsvp, { n: result.confirmed ?? "" });
  return g.errors.failed;
}

function AddGuests({ invitationId, onAdded }: { invitationId: string; onAdded: (guests: OwnGuest[]) => void }) {
  const [bulk, setBulk] = useState(false);
  const [name, setName] = useState("");
  const [list, setList] = useState("");
  const [size, setSize] = useState(2);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const names = bulk ? splitNameList(list) : [name];
  const badLines = bulk ? names.flatMap((n, i) => (nameError(n) ? [i + 1] : [])) : [];
  const tooMany = bulk && names.length > GUEST_LIMITS.bulk;
  const singleError = !bulk && touched ? nameError(name) : undefined;
  const bulkError = tooMany
    ? fill(g.bulk.tooMany, { n: GUEST_LIMITS.bulk })
    : touched && badLines.length > 0
      ? fill(g.bulk.invalidLines, { lines: badLines.slice(0, 8).join(", ") + (badLines.length > 8 ? "…" : "") })
      : undefined;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (busy || names.length === 0 || tooMany || (bulk ? badLines.length > 0 : nameError(name))) return;
    setBusy(true);
    setError(null);
    let result: GuestResult<OwnGuest[]> | null = null;
    try {
      result = await addGuests(invitationId, { names, maxPartySize: size });
    } catch {
      result = null;
    }
    setBusy(false);
    if (!result?.ok) return setError(result ? resultError(result) : g.errors.failed);
    onAdded(result.data);
    setName("");
    setList("");
    setTouched(false);
    setBulk(false);
    document.getElementById(NAME_INPUT_ID)?.focus();
  };

  const stepper = (
    <Stepper
      label={bulk ? g.bulk.maxPartySize : g.add.maxPartySize}
      buttonLabels={copy.ui}
      min={1}
      max={GUEST_LIMITS.partySize}
      value={size}
      onChange={setSize}
      align="start"
    />
  );

  return (
    <section className="editor-section" aria-labelledby="add-guest-title">
      <h2 id="add-guest-title" className="font-display text-h3">
        {g.add.title}
      </h2>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        {bulk ? (
          <Textarea
            label={g.bulk.label}
            hint={g.bulk.hint}
            rows={6}
            value={list}
            autoComplete="off"
            onChange={(e) => setList(e.target.value)}
            onBlur={() => setTouched(true)}
            error={bulkError}
          />
        ) : (
          <Input
            id={NAME_INPUT_ID}
            label={g.add.name}
            hint={g.add.nameHint}
            value={name}
            maxLength={GUEST_LIMITS.name}
            autoComplete="off"
            enterKeyHint="done"
            onChange={(e) => setName(e.target.value)}
            onBlur={() => name && setTouched(true)}
            error={singleError}
          />
        )}
        {stepper}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <Button type="submit" loading={busy}>
            {bulk && names.length > 0 ? fill(g.bulk.submit, { n: names.length }) : g.add.submit}
          </Button>
          <button
            type="button"
            className="inline-flex min-h-tap items-center text-ui text-fg-muted underline decoration-hairline underline-offset-4 hover:text-fg"
            onClick={() => {
              setBulk(!bulk);
              setTouched(false);
              setError(null);
            }}
          >
            {bulk ? g.bulk.cancel : g.bulk.toggle}
          </button>
        </div>
        {error && (
          <p role="alert" className="text-small text-error">
            {error}
          </p>
        )}
      </form>
    </section>
  );
}

type RowMode = "view" | "edit" | "delete";

function GuestRow({
  guest,
  link,
  onAnnounce,
  onSaved,
  onDeleted,
}: {
  guest: OwnGuest;
  link: string;
  onAnnounce: (text: string) => void;
  onSaved: (guest: OwnGuest) => void;
  onDeleted: () => void;
}) {
  const [mode, setMode] = useState<RowMode>("view");
  const [name, setName] = useState(guest.name);
  const [size, setSize] = useState(guest.maxPartySize);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const resetCopied = useRef<ReturnType<typeof setTimeout>>(undefined);
  const editButton = useRef<HTMLButtonElement>(null);

  const back = () => {
    setMode("view");
    setError(null);
    // Return focus to the row once its view mode is back on screen.
    requestAnimationFrame(() => editButton.current?.focus());
  };

  const onCopy = async () => {
    const ok = await copyText(link);
    setCopied(ok);
    onAnnounce(ok ? `${g.list.copied}: ${guest.name}` : g.list.copyFailed);
    if (!ok) setError(g.list.copyFailed);
    clearTimeout(resetCopied.current);
    resetCopied.current = setTimeout(() => setCopied(false), COPIED_FOR);
  };

  const run = async <T,>(action: () => Promise<GuestResult<T>>, done: (data: T) => void) => {
    setBusy(true);
    setError(null);
    let result: GuestResult<T> | null = null;
    try {
      result = await action();
    } catch {
      result = null;
    }
    setBusy(false);
    if (!result?.ok) return setError(result ? resultError(result) : g.errors.failed);
    done(result.data);
  };

  const onSave = (event: FormEvent) => {
    event.preventDefault();
    if (nameError(name)) return;
    run(
      () => updateGuest(guest.id, { name, maxPartySize: size }),
      (saved) => {
        onSaved(saved);
        back();
      },
    );
  };

  if (mode === "edit") {
    const invalid = nameError(name);
    return (
      <li className="guest-row" data-mode="edit">
        <form onSubmit={onSave} noValidate className="flex flex-col gap-6">
          <Input label={g.add.name} value={name} maxLength={GUEST_LIMITS.name} autoComplete="off" autoFocus onChange={(e) => setName(e.target.value)} error={invalid} />
          <Stepper label={g.add.maxPartySize} buttonLabels={copy.ui} min={1} max={GUEST_LIMITS.partySize} value={size} onChange={setSize} align="start" />
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={busy} disabled={Boolean(invalid)}>
              {g.list.save}
            </Button>
            <Button variant="secondary" onClick={back} disabled={busy}>
              {g.list.cancel}
            </Button>
          </div>
          {error && (
            <p role="alert" className="text-small text-error">
              {error}
            </p>
          )}
        </form>
      </li>
    );
  }

  return (
    <li className="guest-row" data-mode={mode === "delete" ? "delete" : undefined}>
      <div className="guest-row-main">
        <p className="min-w-0 font-medium text-fg">{guest.name}</p>
        <p className="text-small text-fg-muted tabular-nums">{fill(g.list.partySize, { n: guest.maxPartySize })}</p>
      </div>

      {mode === "delete" ? (
        <div className="guest-row-confirm" role="group" aria-label={g.list.delete}>
          <p className="text-small text-fg">{g.list.confirmDelete}</p>
          <div className="flex flex-wrap gap-3">
            <Button loading={busy} onClick={() => run(() => deleteGuest(guest.id), onDeleted)}>
              {g.list.delete}
            </Button>
            <Button variant="secondary" onClick={back} disabled={busy} autoFocus>
              {g.list.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="guest-row-actions">
          <button type="button" className="btn btn-secondary guest-copy" onClick={onCopy}>
            <span className="btn-label">
              {copied ? <Check size={18} strokeWidth={1.25} aria-hidden /> : <Link2 size={18} strokeWidth={1.25} aria-hidden />}
              {copied ? g.list.copied : g.list.copyLink}
            </span>
          </button>
          <button
            ref={editButton}
            type="button"
            className="stepper-button"
            aria-label={`${g.list.edit}: ${guest.name}`}
            onClick={() => {
              setName(guest.name);
              setSize(guest.maxPartySize);
              setMode("edit");
            }}
          >
            <Pencil size={18} strokeWidth={1.25} aria-hidden />
          </button>
          <button type="button" className="stepper-button" aria-label={`${g.list.delete}: ${guest.name}`} onClick={() => setMode("delete")}>
            <Trash2 size={18} strokeWidth={1.25} aria-hidden />
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className="guest-row-error text-small text-error">
          {error}
        </p>
      )}
    </li>
  );
}

/** Clipboard API where available; the old selection-based copy for in-app browsers without it. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.append(area);
    area.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch {
      ok = false;
    }
    area.remove();
    return ok;
  }
}
