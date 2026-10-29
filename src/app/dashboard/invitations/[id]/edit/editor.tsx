"use client";

import { useActionState, useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpRight, Check, Eye, Link2, LockKeyhole, Loader2, Plus, X } from "lucide-react";
import { copy } from "@content/copy.ka";
import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonArrow } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { FormError } from "@/components/ui/form-error";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { copyText } from "@/lib/clipboard";
import { EVENT_TYPES, isCoupleEvent, type EventType } from "@/lib/events";
import type { InvitationStatus } from "@/lib/invitations/access";
import { previewContent } from "@/lib/invitations/preview";
import { invitationDraftSchema, LIMITS } from "@/lib/invitations/schema";
import { RESPONSE_LIMITS } from "@/lib/responses/schema";
import { fill } from "@/lib/text";
import { cn } from "@/lib/utils";
import { saveDraft, setPublishedForDev } from "../../actions";
import { payAndPublish, type PayState } from "../../payment-actions";
import { fieldErrors, fromContent, newRowKey, toDraftInput, type FormState } from "./form-state";
import { PhonePreview } from "./phone-preview";
import { PhotoField } from "./photo-field";

const t = copy.editor;
const AUTOSAVE_DELAY = 800;
const RETRY_DELAY = 4000;

type SaveState = "saved" | "pending" | "saving" | "failed" | "invalid";
type TemplateOption = { id: string; displayName: string; thumbnail: string; tone: string };
type Settings = { templateId: string; eventType: EventType; maxPartySize: number };

export type EditorProps = {
  id: string;
  slug: string;
  status: InvitationStatus;
  templateId: string;
  eventType: EventType;
  maxPartySize: number;
  templates: TemplateOption[];
  initialContent: unknown;
  userId: string;
  supabaseUrl: string;
  siteUrl: string;
  /** Stand-in event date for the preview while the host hasn't chosen one. */
  fallbackDate: string;
  /** "49 ლარი", from server config; null if payments aren't configured. */
  priceLabel: string | null;
  devTools: boolean;
};

export function Editor(props: EditorProps) {
  const { id, fallbackDate } = props;
  const [form, setForm] = useState(() => fromContent(props.initialContent));
  const [settings, setSettings] = useState<Settings>({
    templateId: props.templateId,
    eventType: props.eventType,
    maxPartySize: props.maxPartySize,
  });
  const [preview, setPreview] = useState(() => {
    const draft = invitationDraftSchema.safeParse(toDraftInput(form, props.eventType));
    return previewContent(draft.success ? draft.data : {}, fallbackDate, props.eventType);
  });
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [touched, setTouched] = useState<ReadonlySet<string>>(() => new Set());
  const [previewOpen, setPreviewOpen] = useState(false);
  const errors = useMemo(() => fieldErrors(form, settings.eventType), [form, settings.eventType]);

  // Autosave: the latest valid state waits here until the debounce fires; older answers are ignored.
  const pending = useRef<{ form: FormState; settings: Settings } | null>(null);
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
        result = await saveDraft(id, job.settings, toDraftInput(job.form, job.settings.eventType));
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

    // Save right away if the host leaves or switches apps mid-debounce.
    const flush = () => {
      if (document.visibilityState === "hidden" && pending.current) run();
    };
    document.addEventListener("visibilitychange", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      clearTimeout(timer.current);
    };
  }, [id]);

  const commit = (next: FormState, nextSettings: Settings = settings) => {
    setForm(next);
    setSettings(nextSettings);
    const draft = invitationDraftSchema.safeParse(toDraftInput(next, nextSettings.eventType));
    if (!draft.success) {
      clearTimeout(timer.current);
      pending.current = null;
      setSaveState("invalid");
      return;
    }
    setPreview(previewContent(draft.data, fallbackDate, nextSettings.eventType));
    pending.current = { form: next, settings: nextSettings };
    setSaveState("pending");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => persist.current(), AUTOSAVE_DELAY);
  };

  const touch = (key: string) => setTouched((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  /** The error once the field has been left. */
  const errorFor = (key: string) => (touched.has(key) ? errors[key] : undefined);
  const onBlur = (key: string) => () => touch(key);

  const setVenue = (key: keyof FormState["venue"], value: string) => commit({ ...form, venue: { ...form.venue, [key]: value } });
  const setRow = (index: number, key: "time" | "label", value: string) =>
    commit({ ...form, program: form.program.map((row, i) => (i === index ? { ...row, [key]: value } : row)) });

  const closePreview = useCallback(() => setPreviewOpen(false), []);
  const incomplete = Object.keys(errors).length > 0;
  const couple = isCoupleEvent(settings.eventType);

  return (
    <div className="pb-28 lg:pb-16">
      <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-nav">
        <div className="mx-auto flex h-16 max-w-[80rem] items-center justify-between gap-4 px-gutter-brand">
          <Link href="/dashboard" className="-ml-2 inline-flex h-10 items-center gap-2 rounded-full px-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" strokeWidth={1.75} aria-hidden />
            {t.back}
          </Link>
          <SaveIndicator state={saveState} />
        </div>
      </header>

      <div className="mx-auto grid max-w-[80rem] gap-10 px-gutter-brand pt-8 lg:grid-cols-[minmax(0,1fr)_25rem] lg:gap-14 lg:pt-10">
        <div className="grid min-w-0 content-start gap-6">
          <div className="grid gap-2">
            <h1 className="font-display text-title">{t.heading}</h1>
            {incomplete ? <p className="text-muted-foreground">{t.incomplete}</p> : null}
          </div>

          <PublishCard {...props} status={props.status} incomplete={incomplete} unsaved={saveState !== "saved"} />

          <form className="grid gap-6" onSubmit={(e) => e.preventDefault()} noValidate>
            <Section title={t.sections.event}>
              <div className="grid gap-2">
                <label htmlFor="event-type" className="text-sm font-medium">
                  {t.fields.eventType}
                </label>
                <Select
                  value={settings.eventType}
                  onValueChange={(value) => commit(form, { ...settings, eventType: value as EventType })}
                >
                  <SelectTrigger id="event-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {copy.events.types[type]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {couple ? (
                <div className="grid gap-5 sm:grid-cols-2">
                  {([0, 1] as const).map((i) => (
                    <Field key={i} id={`partner-${i}`} label={i === 0 ? t.fields.partnerA : t.fields.partnerB} error={errorFor(`partners.${i}`)}>
                      {(control) => (
                        <Input
                          {...control}
                          value={form.partners[i]}
                          maxLength={LIMITS.name}
                          autoComplete="off"
                          onBlur={onBlur(`partners.${i}`)}
                          onChange={(e) => {
                            const partners: [string, string] = [...form.partners];
                            partners[i] = e.target.value;
                            commit({ ...form, partners });
                          }}
                        />
                      )}
                    </Field>
                  ))}
                </div>
              ) : (
                <Field id="title" label={t.fields.title} hint={t.fields.titleHint} error={errorFor("title")}>
                  {(control) => (
                    <Input
                      {...control}
                      value={form.title}
                      maxLength={LIMITS.title}
                      autoComplete="off"
                      placeholder={copy.events.titlePlaceholders[settings.eventType]}
                      onBlur={onBlur("title")}
                      onChange={(e) => commit({ ...form, title: e.target.value })}
                    />
                  )}
                </Field>
              )}
            </Section>

            <Section title={t.sections.date}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="date" label={t.fields.date} error={errorFor("date")}>
                  {(control) => (
                    <Input
                      {...control}
                      type="date"
                      value={form.date}
                      onBlur={onBlur("date")}
                      onChange={(e) => commit({ ...form, date: e.target.value, time: form.time || (e.target.value ? "18:00" : "") })}
                    />
                  )}
                </Field>
                <Field id="time" label={t.fields.time} error={errorFor("time")}>
                  {(control) => <Input {...control} type="time" value={form.time} onBlur={onBlur("time")} onChange={(e) => commit({ ...form, time: e.target.value })} />}
                </Field>
              </div>
            </Section>

            <Section title={t.sections.venue}>
              <Field id="venue-name" label={t.fields.venueName} error={errorFor("venue.name")}>
                {(control) => (
                  <Input {...control} value={form.venue.name} maxLength={LIMITS.venueName} onBlur={onBlur("venue.name")} onChange={(e) => setVenue("name", e.target.value)} />
                )}
              </Field>
              <Field id="venue-address" label={t.fields.address} error={errorFor("venue.address")}>
                {(control) => (
                  <Textarea
                    {...control}
                    rows={2}
                    className="min-h-24"
                    value={form.venue.address}
                    maxLength={LIMITS.address}
                    onBlur={onBlur("venue.address")}
                    onChange={(e) => setVenue("address", e.target.value)}
                  />
                )}
              </Field>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="venue-city" label={t.fields.city} error={errorFor("venue.city")}>
                  {(control) => (
                    <Input {...control} value={form.venue.city} maxLength={LIMITS.city} onBlur={onBlur("venue.city")} onChange={(e) => setVenue("city", e.target.value)} />
                  )}
                </Field>
                <Field id="dress-code" label={t.fields.dressCode} aside={t.fields.optional} error={errorFor("dressCode")}>
                  {(control) => (
                    <Input
                      {...control}
                      value={form.dressCode}
                      maxLength={LIMITS.dressCode}
                      onBlur={onBlur("dressCode")}
                      onChange={(e) => commit({ ...form, dressCode: e.target.value })}
                    />
                  )}
                </Field>
              </div>
              <Field id="map-query" label={t.fields.mapQuery} aside={t.fields.optional} hint={t.fields.mapQueryHint} error={errorFor("venue.mapQuery")}>
                {(control) => (
                  <Input
                    {...control}
                    value={form.venue.mapQuery}
                    maxLength={LIMITS.mapQuery}
                    onBlur={onBlur("venue.mapQuery")}
                    onChange={(e) => setVenue("mapQuery", e.target.value)}
                  />
                )}
              </Field>
            </Section>

            <Section title={t.sections.message}>
              <Field
                id="message"
                label={t.fields.message}
                aside={`${form.message.length} / ${LIMITS.message}`}
                hint={t.fields.optional}
                error={errorFor("message")}
              >
                {(control) => (
                  <Textarea
                    {...control}
                    rows={5}
                    value={form.message}
                    maxLength={LIMITS.message}
                    onBlur={onBlur("message")}
                    onChange={(e) => commit({ ...form, message: e.target.value })}
                  />
                )}
              </Field>
            </Section>

            <Section title={t.sections.program} aside={t.fields.optional}>
              {form.program.length === 0 ? <p className="text-sm text-muted-foreground">{t.program.empty}</p> : null}
              <ol className="grid gap-4">
                {form.program.map((row, i) => (
                  <li key={row.key} className="grid grid-cols-[7rem_minmax(0,1fr)_auto] items-start gap-3">
                    <Field id={`program-${i}-time`} label={t.fields.programTime} error={errorFor(`program.${i}.time`)}>
                      {(control) => (
                        <Input {...control} type="time" value={row.time} onBlur={onBlur(`program.${i}.time`)} onChange={(e) => setRow(i, "time", e.target.value)} />
                      )}
                    </Field>
                    <Field id={`program-${i}-label`} label={t.fields.programLabel} error={errorFor(`program.${i}.label`)}>
                      {(control) => (
                        <Input
                          {...control}
                          value={row.label}
                          maxLength={LIMITS.programLabel}
                          onBlur={onBlur(`program.${i}.label`)}
                          onChange={(e) => setRow(i, "label", e.target.value)}
                        />
                      )}
                    </Field>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-7"
                      aria-label={`${t.program.remove} ${i + 1}`}
                      onClick={() => commit({ ...form, program: form.program.filter((_, j) => j !== i) })}
                    >
                      <X strokeWidth={1.75} />
                    </Button>
                  </li>
                ))}
              </ol>
              {form.program.length < LIMITS.programItems ? (
                <Button
                  type="button"
                  variant="outline"
                  className="justify-self-start"
                  onClick={() => commit({ ...form, program: [...form.program, { key: newRowKey(), time: "", label: "" }] })}
                >
                  <Plus strokeWidth={1.75} /> {t.program.add}
                </Button>
              ) : null}
            </Section>

            <Section title={t.sections.photo} aside={t.fields.optional}>
              <PhotoField photo={form.photo} onChange={(photo) => commit({ ...form, photo })} userId={props.userId} supabaseUrl={props.supabaseUrl} />
            </Section>

            <Section title={t.sections.template}>
              <fieldset className="grid grid-cols-2 gap-4 sm:max-w-md">
                <legend className="sr-only">{t.template.label}</legend>
                {props.templates.map((template) => (
                  <label key={template.id} className="group/template grid cursor-pointer gap-3">
                    <input
                      type="radio"
                      name="template"
                      value={template.id}
                      checked={settings.templateId === template.id}
                      onChange={() => commit(form, { ...settings, templateId: template.id })}
                      className="peer sr-only"
                    />
                    <span className="relative block overflow-hidden rounded-lg border border-border ring-offset-2 ring-offset-background peer-checked:ring-2 peer-checked:ring-primary peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/40">
                      {/* eslint-disable-next-line @next/next/no-img-element -- a small static thumbnail */}
                      <img src={template.thumbnail} alt="" width={320} height={480} className="block h-auto w-full" />
                      {settings.templateId === template.id ? (
                        <span className="absolute top-2.5 right-2.5 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground">
                          <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                        </span>
                      ) : null}
                    </span>
                    <span className="grid">
                      <span className="font-medium">{template.displayName}</span>
                      <span className="text-sm text-muted-foreground">{template.tone}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </Section>

            <Section title={t.sections.rsvp}>
              <div className="grid gap-5 sm:grid-cols-2">
                <Field id="rsvp-deadline" label={t.fields.rsvpDeadline} hint={t.fields.rsvpDeadlineHint} error={errorFor("rsvpDeadline")}>
                  {(control) => (
                    <Input
                      {...control}
                      type="date"
                      value={form.rsvpDeadline}
                      max={form.date || undefined}
                      onBlur={onBlur("rsvpDeadline")}
                      onChange={(e) => commit({ ...form, rsvpDeadline: e.target.value })}
                    />
                  )}
                </Field>
                <div className="grid content-start gap-2">
                  <label htmlFor="max-party" className="text-sm font-medium">
                    {t.fields.maxPartySize}
                  </label>
                  <Select
                    value={String(settings.maxPartySize)}
                    onValueChange={(value) => commit(form, { ...settings, maxPartySize: Number(value) })}
                  >
                    <SelectTrigger id="max-party" aria-describedby="max-party-hint">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: RESPONSE_LIMITS.partySize }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {fill(t.fields.maxPartySizeOption, { n })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p id="max-party-hint" className="text-sm text-muted-foreground">
                    {t.fields.maxPartySizeHint}
                  </p>
                </div>
              </div>
            </Section>
          </form>
        </div>

        <PhonePreview
          src={`/dashboard/invitations/${id}/frame`}
          templateId={settings.templateId}
          eventType={settings.eventType}
          maxPartySize={settings.maxPartySize}
          content={preview}
          open={previewOpen}
          onClose={closePreview}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:hidden">
        <Button size="lg" variant="outline" className="bg-lift shadow-float" onClick={() => setPreviewOpen(true)} aria-haspopup="dialog">
          <Eye strokeWidth={1.75} /> {t.preview}
        </Button>
      </div>
    </div>
  );
}

function Section({ title, aside, children }: { title: string; aside?: string; children: ReactNode }) {
  return (
    <section className="grid gap-5 rounded-xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="font-display text-heading">{title}</h2>
        {aside ? <span className="text-sm text-muted-foreground">{aside}</span> : null}
      </div>
      {children}
    </section>
  );
}

function SaveIndicator({ state }: { state: SaveState }) {
  const text = { saved: t.save.saved, pending: t.save.saved, saving: t.save.saving, failed: t.save.failed, invalid: t.save.invalid }[state];
  const problem = state === "failed" || state === "invalid";
  return (
    <p role="status" aria-live="polite" className={cn("flex items-center gap-2 text-sm", problem ? "text-destructive" : "text-muted-foreground")}>
      {state === "saving" ? (
        <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" strokeWidth={2} aria-hidden />
      ) : (
        <span aria-hidden className={cn("size-1.5 rounded-full", problem ? "bg-destructive" : "bg-foreground/40")} />
      )}
      {text}
    </p>
  );
}

/**
 * Draft: what paying does, and Pay. Live: the link with a copy button. Paying needs complete, saved
 * details: the server checks the stored content, so unsaved edits would be checked as they were.
 */
function PublishCard({ id, slug, status, siteUrl, devTools, priceLabel, incomplete, unsaved }: EditorProps & { incomplete: boolean; unsaved: boolean }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const url = `${siteUrl.replace(/\/$/, "")}/i/${slug}`;
  const live = status !== "draft";
  const hint = incomplete ? t.payNeedsDetails : priceLabel ? fill(t.payHint, { price: priceLabel }) : null;

  return (
    <section className={cn("grid gap-5 rounded-xl p-5 sm:p-7", live ? "border border-border bg-card" : "inverted")}>
      {live ? (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <Badge>{t.published}</Badge>
            <span className="text-sm text-muted-foreground">{t.publishedHint}</span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <p className="flex min-h-12 min-w-0 flex-1 items-center gap-2 rounded-md border border-border bg-background px-4 text-[0.9375rem]">
              <Link2 className="size-4 shrink-0 text-primary" strokeWidth={1.75} aria-hidden />
              <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
            </p>
            <Button
              onClick={async () => {
                if (await copyText(url)) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
            >
              {copied ? <Check strokeWidth={2} /> : null}
              {copied ? t.copied : t.copyLink}
            </Button>
            <Button asChild variant="ghost">
              <a href={`/i/${slug}`} target="_blank" rel="noopener">
                {t.openPage} <ArrowUpRight strokeWidth={1.75} />
              </a>
            </Button>
          </div>
        </>
      ) : (
        <>
          <div className="grid gap-2">
            <h2 className="font-display text-heading">{t.payHeading}</h2>
            <p className="text-muted-foreground">{t.payLead}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <PayButton id={id} disabled={incomplete || unsaved || !priceLabel} hint={hint} />
            <Button asChild variant="ghost" size="lg" className="sm:ml-auto">
              <a href={`/i/${slug}`} target="_blank" rel="noopener" data-testid="draft-page">
                {t.openDraft} <ArrowUpRight strokeWidth={1.75} />
              </a>
            </Button>
          </div>
        </>
      )}
      {devTools ? (
        <button
          type="button"
          disabled={busy}
          className="justify-self-start rounded-sm border border-dashed border-current/40 px-3 py-1.5 text-xs opacity-70"
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
      ) : null}
    </section>
  );
}

/** Submits Pay and publish. While the server prepares the checkout, a calm full-screen hand-off. */
function PayButton({ id, disabled, hint }: { id: string; disabled: boolean; hint: string | null }) {
  const action = useMemo(() => payAndPublish.bind(null, id), [id]);
  const [state, formAction, pending] = useActionState<PayState, FormData>(action, {});

  return (
    <form action={formAction} className="grid gap-3">
      <Button type="submit" size="lg" disabled={disabled || pending} aria-describedby={hint ? `pay-hint-${id}` : undefined} className="w-full sm:w-auto sm:justify-self-start">
        <LockKeyhole strokeWidth={1.75} /> {t.pay} <ButtonArrow />
      </Button>
      {hint ? (
        <p id={`pay-hint-${id}`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {!pending ? <FormError message={state.error ?? null} /> : null}
      {pending ? <RedirectingToPayment /> : null}
    </form>
  );
}

function RedirectingToPayment() {
  // Coming back with the browser's Back button can restore this page from memory with the overlay
  // still up; reload so the editor is usable again.
  useEffect(() => {
    const onShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);

  const p = copy.payment.redirecting;
  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-50 grid place-items-center bg-background px-6 text-foreground animate-in fade-in-0 transition-none duration-300">
      <div className="grid max-w-sm justify-items-center gap-5 text-center">
        <LogoMark size={40} />
        <p className="font-display text-heading">{p.heading}</p>
        <Loader2 className="size-5 animate-spin text-primary motion-reduce:animate-none" strokeWidth={2} aria-hidden />
        <p className="text-sm text-muted-foreground">{p.body}</p>
      </div>
    </div>
  );
}
