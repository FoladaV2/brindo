"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Eye, Plus, X } from "lucide-react";
import { clsx } from "clsx";
import { copy } from "@content/copy.ka";
import { Input, Textarea } from "@/components/ui/Field";
import { Label } from "@/components/ui/Label";
import type { OwnGuest } from "@/lib/guests/schema";
import type { InvitationStatus } from "@/lib/invitations/access";
import { previewContent } from "@/lib/invitations/preview";
import { invitationDraftSchema, LIMITS } from "@/lib/invitations/schema";
import { saveDraft, setPublishedForDev } from "../../actions";
import { fieldErrors, fromContent, newRowKey, toDraftInput, type FormState } from "./form-state";
import { GuestsPanel } from "./guests-panel";
import { PhonePreview } from "./phone-preview";
import { PhotoField } from "./photo-field";
import "./editor.css";

const t = copy.editor;
const AUTOSAVE_DELAY = 800;
const RETRY_DELAY = 4000;

type SaveState = "saved" | "pending" | "saving" | "failed" | "invalid";
type TemplateOption = { id: string; displayName: string; thumbnail: string };
type Tab = "details" | "guests";
const TABS: Tab[] = ["details", "guests"];

export type EditorProps = {
  id: string;
  slug: string;
  status: InvitationStatus;
  templateId: string;
  templates: TemplateOption[];
  initialContent: unknown;
  initialGuests: OwnGuest[];
  userId: string;
  supabaseUrl: string;
  siteUrl: string;
  /** Stand-in event date for the preview while the couple hasn't chosen one. */
  fallbackDate: string;
  devTools: boolean;
};

export function Editor(props: EditorProps) {
  const { id, fallbackDate } = props;
  const [form, setForm] = useState(() => fromContent(props.initialContent));
  const [templateId, setTemplateId] = useState(props.templateId);
  const [preview, setPreview] = useState(() => {
    const draft = invitationDraftSchema.safeParse(toDraftInput(form));
    return previewContent(draft.success ? draft.data : {}, fallbackDate);
  });
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("details");
  const [guests, setGuests] = useState(props.initialGuests);
  const errors = useMemo(() => fieldErrors(form), [form]);

  // Autosave: the latest valid state waits here until the debounce fires; older answers are ignored.
  const pending = useRef<{ form: FormState; templateId: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const sequence = useRef(0);

  const persist = useRef<() => void>(() => {});

  useEffect(() => {
    // Sends whatever is pending; on a network or server failure, keeps it and tries again shortly.
    const run = async () => {
      clearTimeout(timer.current);
      const job = pending.current;
      if (!job) return;
      pending.current = null;
      const mine = ++sequence.current;
      setSaveState("saving");
      let result: Awaited<ReturnType<typeof saveDraft>> | null = null;
      try {
        result = await saveDraft(id, job.templateId, toDraftInput(job.form));
      } catch {
        result = null;
      }
      if (mine !== sequence.current) return;
      if (result?.ok) return setSaveState("saved");
      if (result?.reason === "invalid") return setSaveState("invalid");
      setSaveState("failed");
      pending.current ??= job;
      timer.current = setTimeout(run, RETRY_DELAY);
    };
    persist.current = run;

    // Save right away if the couple leaves or switches apps mid-debounce.
    const flush = () => {
      if (document.visibilityState === "hidden" && pending.current) run();
    };
    document.addEventListener("visibilitychange", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      clearTimeout(timer.current);
    };
  }, [id]);

  const commit = (next: FormState, nextTemplate = templateId) => {
    setForm(next);
    setTemplateId(nextTemplate);
    const draft = invitationDraftSchema.safeParse(toDraftInput(next));
    if (!draft.success) {
      clearTimeout(timer.current);
      pending.current = null;
      setSaveState("invalid");
      return;
    }
    setPreview(previewContent(draft.data, fallbackDate));
    pending.current = { form: next, templateId: nextTemplate };
    setSaveState("pending");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => persist.current(), AUTOSAVE_DELAY);
  };

  const touch = (key: string) => setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  /** Props shared by every input: the error once the field has been left, and marking it touched. */
  const bind = (key: string) => ({
    error: touched.has(key) ? errors[key] : undefined,
    onBlur: () => touch(key),
  });

  const setVenue = (key: keyof FormState["venue"], value: string) => commit({ ...form, venue: { ...form.venue, [key]: value } });
  const setRow = (index: number, key: "time" | "label", value: string) =>
    commit({ ...form, program: form.program.map((row, i) => (i === index ? { ...row, [key]: value } : row)) });

  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const incomplete = Object.keys(errors).length > 0;

  return (
    <div className="pb-section">
      <header className="sticky top-0 z-30 border-b border-hairline bg-bg">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between gap-4 px-gutter">
          <Link href="/dashboard" className="inline-flex min-h-tap items-center gap-2 text-small text-fg-muted hover:text-fg">
            <ArrowLeft size={16} strokeWidth={1.25} aria-hidden />
            {t.back}
          </Link>
          <SaveIndicator state={saveState} />
        </div>
      </header>

      <div className="editor-grid mx-auto max-w-[1280px] px-gutter">
        <div className="editor-form">
          <PublishBar {...props} />
          <Tabs tab={tab} onChange={setTab} guestCount={guests.length} />

          {tab === "guests" ? (
            <div role="tabpanel" id="editor-panel-guests" aria-labelledby="editor-tab-guests">
              <GuestsPanel
                invitationId={id}
                slug={props.slug}
                siteUrl={props.siteUrl}
                published={props.status === "published"}
                guests={guests}
                setGuests={setGuests}
              />
            </div>
          ) : (
            <form
              role="tabpanel"
              id="editor-panel-details"
              aria-labelledby="editor-tab-details"
              className="flex flex-col gap-8"
              onSubmit={(e) => e.preventDefault()}
              noValidate
            >
              {incomplete && <p className="text-small text-fg-muted">{t.incomplete}</p>}

              <Section title={t.sections.names}>
                {([0, 1] as const).map((i) => (
                  <Input
                    key={i}
                    label={i === 0 ? t.fields.partnerA : t.fields.partnerB}
                    value={form.partners[i]}
                    maxLength={LIMITS.name}
                    autoComplete="off"
                    hint={t.fields.namesHint}
                    onChange={(e) => {
                      const partners: [string, string] = [...form.partners];
                      partners[i] = e.target.value;
                      commit({ ...form, partners });
                    }}
                    {...bind(`partners.${i}`)}
                  />
                ))}
              </Section>

              <Section title={t.sections.date}>
                <div className="grid gap-x-6 sm:grid-cols-2">
                  <Input
                    type="date"
                    label={t.fields.date}
                    value={form.date}
                    onChange={(e) => commit({ ...form, date: e.target.value, time: form.time || (e.target.value ? "18:00" : "") })}
                    {...bind("date")}
                  />
                  <Input type="time" label={t.fields.time} value={form.time} onChange={(e) => commit({ ...form, time: e.target.value })} {...bind("time")} />
                </div>
              </Section>

              <Section title={t.sections.venue}>
                <Input label={t.fields.venueName} value={form.venue.name} maxLength={LIMITS.venueName} onChange={(e) => setVenue("name", e.target.value)} {...bind("venue.name")} />
                <Textarea
                  label={t.fields.address}
                  rows={2}
                  value={form.venue.address}
                  maxLength={LIMITS.address}
                  onChange={(e) => setVenue("address", e.target.value)}
                  {...bind("venue.address")}
                />
                <Input label={t.fields.city} value={form.venue.city} maxLength={LIMITS.city} onChange={(e) => setVenue("city", e.target.value)} {...bind("venue.city")} />
                <Input
                  label={t.fields.mapQuery}
                  hint={t.fields.mapQueryHint}
                  value={form.venue.mapQuery}
                  maxLength={LIMITS.mapQuery}
                  onChange={(e) => setVenue("mapQuery", e.target.value)}
                  {...bind("venue.mapQuery")}
                />
                <Input
                  label={t.fields.dressCode}
                  hint={t.fields.optional}
                  value={form.dressCode}
                  maxLength={LIMITS.dressCode}
                  onChange={(e) => commit({ ...form, dressCode: e.target.value })}
                  {...bind("dressCode")}
                />
              </Section>

              <Section title={t.sections.message}>
                <Textarea
                  label={t.fields.message}
                  rows={5}
                  value={form.message}
                  maxLength={LIMITS.message}
                  hint={`${t.fields.optional} · ${form.message.length} / ${LIMITS.message}`}
                  onChange={(e) => commit({ ...form, message: e.target.value })}
                  {...bind("message")}
                />
              </Section>

              <Section title={t.sections.program}>
                {form.program.length === 0 && <p className="text-small text-fg-muted">{t.program.empty}</p>}
                <ol className="flex flex-col gap-2">
                  {form.program.map((row, i) => (
                    <li key={row.key} className="editor-program-row">
                      <Input type="time" label={t.fields.programTime} value={row.time} onChange={(e) => setRow(i, "time", e.target.value)} {...bind(`program.${i}.time`)} />
                      <Input
                        label={t.fields.programLabel}
                        value={row.label}
                        maxLength={LIMITS.programLabel}
                        onChange={(e) => setRow(i, "label", e.target.value)}
                        {...bind(`program.${i}.label`)}
                      />
                      <button
                        type="button"
                        className="stepper-button mt-6"
                        aria-label={`${t.program.remove} ${i + 1}`}
                        onClick={() => commit({ ...form, program: form.program.filter((_, j) => j !== i) })}
                      >
                        <X size={18} strokeWidth={1.25} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ol>
                {form.program.length < LIMITS.programItems && (
                  <button
                    type="button"
                    className="btn btn-secondary self-start"
                    onClick={() => commit({ ...form, program: [...form.program, { key: newRowKey(), time: "", label: "" }] })}
                  >
                    <span className="btn-label">
                      <Plus size={18} strokeWidth={1.25} aria-hidden />
                      {t.program.add}
                    </span>
                  </button>
                )}
              </Section>

              <Section title={t.sections.rsvp}>
                <Input
                  type="date"
                  label={t.fields.rsvpDeadline}
                  hint={t.fields.rsvpDeadlineHint}
                  value={form.rsvpDeadline}
                  max={form.date || undefined}
                  onChange={(e) => commit({ ...form, rsvpDeadline: e.target.value })}
                  {...bind("rsvpDeadline")}
                />
              </Section>

              <Section title={t.sections.photo}>
                <PhotoField
                  photo={form.photo}
                  onChange={(photo) => commit({ ...form, photo })}
                  userId={props.userId}
                  supabaseUrl={props.supabaseUrl}
                />
              </Section>

              <Section title={t.sections.template}>
                <fieldset className="flex flex-wrap gap-4">
                  <legend className="sr-only">{t.template.label}</legend>
                  {props.templates.map((template) => (
                    <label key={template.id} className="editor-template">
                      <input
                        type="radio"
                        name="template"
                        value={template.id}
                        checked={templateId === template.id}
                        onChange={() => commit(form, template.id)}
                        className="sr-only"
                      />
                      {/* eslint-disable-next-line @next/next/no-img-element -- a 13 KB static thumbnail */}
                      <img src={template.thumbnail} alt="" width={160} height={240} />
                      <span className="text-small">{template.displayName}</span>
                    </label>
                  ))}
                </fieldset>
              </Section>
            </form>
          )}
        </div>

        <PhonePreview
          src={`/dashboard/invitations/${id}/frame`}
          templateId={templateId}
          content={preview}
          open={previewOpen}
          onClose={closePreview}
        />
      </div>

      <button type="button" className="btn btn-primary editor-preview-toggle" onClick={() => setPreviewOpen(true)} aria-haspopup="dialog">
        <span className="btn-label">
          <Eye size={18} strokeWidth={1.25} aria-hidden />
          {t.preview}
        </span>
      </button>
    </div>
  );
}

/** Details | Guests. Arrow keys move between the tabs (WAI-ARIA tabs pattern). */
function Tabs({ tab, onChange, guestCount }: { tab: Tab; onChange: (tab: Tab) => void; guestCount: number }) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const next = TABS[(TABS.indexOf(tab) + 1) % TABS.length];
    onChange(next);
    document.getElementById(`editor-tab-${next}`)?.focus();
  };
  return (
    <div role="tablist" aria-label={t.tabs.label} className="editor-tabs" onKeyDown={onKeyDown}>
      {TABS.map((id) => (
        <button
          key={id}
          type="button"
          role="tab"
          id={`editor-tab-${id}`}
          aria-selected={tab === id}
          aria-controls={`editor-panel-${id}`}
          tabIndex={tab === id ? 0 : -1}
          className="editor-tab"
          onClick={() => onChange(id)}
        >
          {t.tabs[id]}
          {id === "guests" && guestCount > 0 && <span className="editor-tab-count tabular-nums">{guestCount}</span>}
        </button>
      ))}
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="editor-section">
      <h2 className="font-display text-h3">{title}</h2>
      <div className="flex flex-col gap-2">{children}</div>
    </section>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const text = {
    saved: t.save.saved,
    pending: t.save.saved,
    saving: t.save.saving,
    failed: t.save.failed,
    invalid: t.save.invalid,
  }[state];
  const problem = state === "failed" || state === "invalid";
  return (
    <p role="status" aria-live="polite" className={clsx("flex items-center gap-2 text-small", problem ? "text-error" : "text-fg-muted")}>
      <span
        aria-hidden
        className={clsx(
          "h-1.5 w-1.5 rounded-pill",
          problem ? "bg-error" : state === "saved" ? "bg-accent" : "editor-saving-dot bg-control",
        )}
      />
      {text}
    </p>
  );
}

/** The link (read-only for now), open-page, and Publish, which unlocks with payment in a later stage. */
function PublishBar({ id, slug, status, siteUrl, devTools }: EditorProps) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const url = `${siteUrl.replace(/\/$/, "")}/i/${slug}`;

  return (
    <div className="flex flex-col gap-6 rounded-card border border-hairline bg-raised p-6">
      <div className="flex flex-col gap-2">
        <Label>{t.link}</Label>
        <p className="font-medium break-all text-fg">{url}</p>
        <p className="text-small text-fg-muted">{t.linkHint}</p>
      </div>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <span title={t.publishHint} className="inline-flex">
          <button type="button" className="btn btn-primary" disabled aria-describedby={`publish-hint-${id}`}>
            <span className="btn-label">{t.publish}</span>
          </button>
        </span>
        <a href={`/i/${slug}`} target="_blank" rel="noopener" className="inline-flex min-h-tap items-center gap-2 text-ui hover:text-accent-fg">
          {t.openPage}
          <ArrowUpRight size={16} strokeWidth={1.25} aria-hidden />
        </a>
      </div>
      <p id={`publish-hint-${id}`} className="-mt-3 text-small text-fg-muted">
        {t.publishHint}
      </p>
      {devTools && (
        <button
          type="button"
          disabled={busy}
          className="self-start rounded-card border border-dashed border-control px-3 py-2 font-mono text-small text-fg-muted"
          onClick={() =>
            startTransition(async () => {
              await setPublishedForDev(id, status !== "published");
              router.refresh();
            })
          }
        >
          {/* Development tool only; not shown in production builds. */}
          {status === "published" ? "DEV: mark as draft" : "DEV: mark as published"} ({status})
        </button>
      )}
    </div>
  );
}
