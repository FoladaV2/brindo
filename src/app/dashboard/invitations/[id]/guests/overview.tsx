"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, Copy, MessageCircle } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Chip } from "@/components/legacy/Chip";
import { Divider } from "@/templates/ui/Divider";
import { Textarea } from "@/components/legacy/Field";
import { Label } from "@/templates/ui/Label";
import { copyText } from "@/lib/clipboard";
import { reminderText, summarize, type GuestStatus, type OverviewGuest, type OverviewSummary } from "@/lib/guests/overview";
import { guestLink } from "@/lib/guests/schema";
import { fill } from "@/lib/text";
import "./overview.css";

const t = copy.guestsOverview;
const FILTERS = ["all", "confirmed", "declined", "awaiting"] as const;
type Filter = (typeof FILTERS)[number];
const DOT = { confirmed: "filled", awaiting: "hollow", declined: "muted" } as const satisfies Record<GuestStatus, string>;
/** Coming back to the tab twice within this many ms refetches only once. */
const REFRESH_GAP = 2000;

type GuestOverviewProps = {
  guests: OverviewGuest[];
  slug: string;
  siteUrl: string;
  published: boolean;
  /** The pre-written reminder, deadline filled in. The couple can edit it before copying. */
  reminder: string;
  addGuestsHref: string;
};

/**
 * Summary, filterable list and reminder helper. Data comes from the server page; it is fetched again
 * whenever the couple returns to the tab (say, from Viber), so answers appear without websockets.
 */
export function GuestOverview({ guests, slug, siteUrl, published, reminder, addGuestsHref }: GuestOverviewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  useRefreshOnReturn();
  const summary = useMemo(() => summarize(guests), [guests]);
  const awaiting = useMemo(() => guests.filter((g) => g.status === "awaiting"), [guests]);

  if (guests.length === 0) {
    return (
      <div className="mt-20 flex flex-col items-center text-center">
        <Divider className="w-full max-w-[20rem]" />
        <p className="mt-12 max-w-[32ch] font-display text-h3 text-balance">{t.empty}</p>
        <Link href={addGuestsHref} className="btn btn-primary mt-10">
          <span className="btn-label">{t.addGuests}</span>
        </Link>
      </div>
    );
  }

  const shown = filter === "all" ? guests : guests.filter((g) => g.status === filter);
  const counts: Record<Filter, number> = { all: summary.invited, ...summary };

  return (
    <>
      <Summary summary={summary} />

      {awaiting.length > 0 && <Reminder guests={awaiting} slug={slug} siteUrl={siteUrl} published={published} initialMessage={reminder} />}

      <section aria-labelledby="overview-list-title" className="mt-16 sm:mt-20">
        <h2 id="overview-list-title" className="sr-only">
          {t.title}
        </h2>
        <div role="group" aria-label={t.filters.label} className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button key={f} type="button" aria-pressed={filter === f} className="overview-filter" onClick={() => setFilter(f)}>
              {t.filters[f]}
              <span className="overview-filter-count tabular-nums">{counts[f]}</span>
            </button>
          ))}
        </div>

        {shown.length === 0 ? (
          <p className="mt-10 border-t border-hairline pt-10 text-body text-fg-muted">{filter !== "all" && t.emptyFilter[filter]}</p>
        ) : (
          <ul className="overview-list mt-8">
            {shown.map((guest) => (
              <li key={guest.id} className="overview-row">
                <p className="overview-name min-w-0 font-medium text-fg">{guest.name}</p>
                <p className={guest.status === "confirmed" ? "overview-party text-small text-fg tabular-nums" : "overview-party text-small text-fg-muted tabular-nums"}>
                  {guest.status === "confirmed" ? fill(t.party, { n: guest.partySize }) : fill(t.invitedFor, { n: guest.maxPartySize })}
                </p>
                <Chip dot={DOT[guest.status]} className="overview-chip">
                  {t.status[guest.status]}
                </Chip>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-6 text-small text-fg-muted">{t.readOnly}</p>
      </section>
    </>
  );
}

/** Refetches the server data when the tab becomes visible or the window regains focus. */
function useRefreshOnReturn() {
  const router = useRouter();
  useEffect(() => {
    let last = Date.now();
    const refresh = () => {
      if (document.visibilityState !== "visible" || Date.now() - last < REFRESH_GAP) return;
      last = Date.now();
      router.refresh();
    };
    addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [router]);
}

function Summary({ summary }: { summary: OverviewSummary }) {
  const cells = [
    { key: "invited", n: summary.invited, label: t.summary.invited },
    { key: "confirmed", n: summary.confirmed, label: t.summary.confirmed },
    { key: "declined", n: summary.declined, label: t.summary.declined },
    { key: "awaiting", n: summary.awaiting, label: t.summary.awaiting },
  ];
  return (
    <section aria-label={t.summary.label} className="mt-12 sm:mt-16">
      <dl className="overview-summary">
        {cells.map((cell, i) => (
          <div key={cell.key} className="overview-stat rise-in" style={{ "--i": i } as CSSProperties}>
            <Label as="dt">{cell.label}</Label>
            <dd className="overview-value font-display tabular-nums">{cell.n}</dd>
            {cell.key === "confirmed" && (
              <dd className="overview-headcount text-small text-gilt-fg tabular-nums">{fill(t.summary.headcount, { n: summary.headcount })}</dd>
            )}
          </div>
        ))}
      </dl>
    </section>
  );
}

const COPIED_FOR = 2400;

function Reminder({
  guests,
  slug,
  siteUrl,
  published,
  initialMessage,
}: {
  guests: OverviewGuest[];
  slug: string;
  siteUrl: string;
  published: boolean;
  initialMessage: string;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState(initialMessage);
  /** Guests whose reminder was copied during this visit, so the couple can see who is left. */
  const [copied, setCopied] = useState<ReadonlySet<string>>(() => new Set());
  const [latest, setLatest] = useState<string | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const resetLatest = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onCopy = async (guest: OverviewGuest) => {
    const ok = await copyText(reminderText(message, guestLink(siteUrl, slug, guest.token)));
    setFailed(ok ? null : guest.id);
    setAnnouncement(ok ? `${t.remind.copied}: ${guest.name}` : t.remind.copyFailed);
    if (!ok) return;
    setCopied((prev) => new Set(prev).add(guest.id));
    setLatest(guest.id);
    clearTimeout(resetLatest.current);
    resetLatest.current = setTimeout(() => setLatest(null), COPIED_FOR);
  };

  return (
    <section aria-labelledby="remind-title" className="overview-remind mt-10">
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <h2 id="remind-title" className="font-display text-h3 text-balance tabular-nums">
          {guests.length === 1 ? t.remind.titleOne : fill(t.remind.title, { n: guests.length })}
        </h2>
        <button type="button" className="btn btn-secondary shrink-0" aria-expanded={open} aria-controls="remind-panel" onClick={() => setOpen(!open)}>
          <span className="btn-label">
            <MessageCircle size={18} strokeWidth={1.25} aria-hidden />
            {open ? t.remind.close : t.remind.open}
          </span>
        </button>
      </div>

      {open && (
        <div id="remind-panel" className="rise-in mt-8 flex flex-col gap-6">
          <p className="max-w-[56ch] text-small text-fg-muted">{t.remind.lead}</p>
          {!published && <p className="text-small text-gilt-fg">{t.remind.notPublished}</p>}
          <Textarea label={t.remind.messageLabel} hint={t.remind.messageHint} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          <ul className="overview-remind-list">
            {guests.map((guest) => {
              const done = copied.has(guest.id);
              return (
                <li key={guest.id} className="overview-remind-row">
                  <span className="flex min-w-0 items-center gap-3">
                    <span aria-hidden className={done ? "h-2 w-2 shrink-0 rounded-pill bg-gilt" : "h-2 w-2 shrink-0 rounded-pill border border-gilt"} />
                    <span className="min-w-0 font-medium">{guest.name}</span>
                  </span>
                  <button type="button" className="btn btn-secondary overview-remind-copy" onClick={() => onCopy(guest)}>
                    <span className="btn-label">
                      {latest === guest.id ? <Check size={18} strokeWidth={1.25} aria-hidden /> : <Copy size={18} strokeWidth={1.25} aria-hidden />}
                      {latest === guest.id ? t.remind.copied : t.remind.copy}
                      <span className="sr-only">{`: ${guest.name}`}</span>
                    </span>
                  </button>
                  {failed === guest.id && (
                    <p role="alert" className="basis-full text-small text-error">
                      {t.remind.copyFailed}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </section>
  );
}
