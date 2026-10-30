import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowUpRight, ChevronDown, MapPin, Shirt } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Grain } from "@/templates/ui/Grain";
import { Halo } from "@/templates/ui/Halo";
import { Label } from "@/templates/ui/Label";
import { LightSweep } from "@/templates/ui/LightSweep";
import { Wordmark } from "@/components/brand/Wordmark";
import { widestNameLineEm } from "@/lib/invitations/fit";
import { mapLinks } from "@/lib/invitations/maps";
import { nameParts, titleWords, type InvitationContent } from "@/lib/invitations/schema";
import { fill } from "@/lib/text";
import type { TemplateId } from "../registry";
import type { InvitationRsvp, TemplateProps } from "../types";
import { formatDate, formatLongDate } from "./format";
import { ReplyBar } from "./ReplyBar";
import { RsvpForm } from "./RsvpForm";
import "../invitation.css";

const t = copy.invitation;

/** Matches .inv-title letter-spacing; fitting must count it. */
const TITLE_TRACKING_EM = 0.01;
/** A program this short stays open; a longer one folds away, so it doesn't crowd the details. */
const PROGRAM_OPEN_UP_TO = 3;

/**
 * What sets one template apart from another. The layout and components are shared; colors and
 * motion timing come from the surface tokens and the template's own CSS, scoped by [data-template].
 */
export type Look = {
  id: TemplateId;
  surface: "light" | "dark";
  /** The photo: a small arched window beside the title, or filling the page behind the reply card. */
  photo: "arch" | "backdrop";
  /** ms before one light sweep crosses the title, or null for none. */
  sweepDelay: number | null;
};

/**
 * Two things, in the order a guest needs them: the details in one reading column (what, when,
 * where, what to wear, the host's words), then a reply card with a single job. On a computer they
 * sit side by side and the page never scrolls (a very long invitation scrolls inside its column);
 * on a phone they stack, and a button stays in reach until the reply card is on screen.
 * Server-rendered; only the reply runs on the client.
 */
export function Invitation({ look, content, eventType, rsvp }: TemplateProps & { look: Look }) {
  const photo = content.photo;
  return (
    <article data-surface={look.surface} data-template={look.id} data-photo={look.photo} className="inv isolate bg-bg text-fg">
      <Grain />
      {photo && look.photo === "backdrop" ? (
        <div className="inv-backdrop" aria-hidden>
          <PhotoImage photo={photo} sizes="(min-width: 1024px) 60vw, 100vw" />
        </div>
      ) : (
        <Halo />
      )}
      <div className="inv-sheet">
        <div className="inv-details">
          <div className="inv-details-inner">
            <header className="inv-head rise-in">
              <div className="inv-head-text">
                <Label>{t.kickers[eventType]}</Label>
                <Title content={content} sweepDelay={look.sweepDelay} />
              </div>
              {photo && look.photo === "arch" && (
                <div className="inv-arch">
                  <PhotoImage photo={photo} sizes="(min-width: 1024px) 11rem, 7rem" />
                </div>
              )}
            </header>
            <Facts content={content} />
            {content.message && <Message text={content.message} />}
            {content.program.length > 0 && <Program items={content.program} />}
          </div>
        </div>
        <div className="inv-reply">
          {rsvp && <Reply deadline={content.rsvpDeadline} rsvp={rsvp} />}
          <Footer surface={look.surface} />
        </div>
      </div>
      {rsvp && !rsvp.closed && <ReplyBar rsvp={rsvp} label={t.rsvp.replyBar} />}
    </article>
  );
}

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

/**
 * The event's name: two names around an ampersand, or one title. Lines break where they naturally
 * would; the size comes from the widest word (so no word overflows) and the height it may take.
 */
function Title({ content, sweepDelay }: { content: Pick<InvitationContent, "partners" | "title">; sweepDelay: number | null }) {
  const style = {
    "--fit": (widestNameLineEm(titleWords(content), TITLE_TRACKING_EM) * 1.03).toFixed(3),
    "--lines": titleWords(content).flatMap(nameParts).length,
  } as CSSProperties;
  const lines = content.partners ? (
    <>
      <span className="inv-title-line">{content.partners[0]}</span> <span className="inv-amp">{t.ampersand}</span>{" "}
      <span className="inv-title-line">{content.partners[1]}</span>
    </>
  ) : (
    <span className="inv-title-line">{content.title}</span>
  );
  return (
    <div className="inv-title-frame">
      <h1 className="inv-title font-display" style={style}>
        {sweepDelay === null ? lines : <LightSweep delay={sweepDelay}>{lines}</LightSweep>}
      </h1>
    </div>
  );
}

/** When, where, what to wear: one row each, the main line first. */
function Facts({ content }: { content: InvitationContent }) {
  const date = formatDate(content.startsAt);
  const links = mapLinks(content.venue);
  return (
    <dl className="inv-facts rise-in" style={rise(1)}>
      <div className="inv-fact">
        <dt className="sr-only">{t.date.label}</dt>
        <dd className="contents">
          <span className="inv-tile font-display tabular-nums">{date.day}</span>
          <span className="inv-fact-body">
            <span className="inv-fact-main">{`${date.month} ${date.year}`}</span>
            <span className="inv-fact-sub tabular-nums">{`${date.weekday} · ${date.time}`}</span>
          </span>
        </dd>
      </div>
      <div className="inv-fact">
        <dt className="sr-only">{t.venue.label}</dt>
        <dd className="contents">
          <span aria-hidden className="inv-tile">
            <MapPin size={22} strokeWidth={1.25} />
          </span>
          <span className="inv-fact-body">
            <span className="inv-fact-main">{content.venue.name}</span>
            <address className="inv-fact-sub flex flex-col not-italic">
              {content.venue.address.split(/\n+/).map((line, i) => (
                <span key={i}>{line}</span>
              ))}
              <span>{content.venue.city}</span>
            </address>
            <span className="inv-links">
              {[
                [links.google, t.venue.googleMaps],
                [links.apple, t.venue.appleMaps],
              ].map(([href, label]) => (
                <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inv-link">
                  {label}
                  <ArrowUpRight size={14} strokeWidth={1.25} aria-hidden />
                </a>
              ))}
            </span>
          </span>
        </dd>
      </div>
      {content.dressCode && (
        <div className="inv-fact">
          <dt className="sr-only">{t.venue.dressCode}</dt>
          <dd className="contents">
            <span aria-hidden className="inv-tile">
              <Shirt size={22} strokeWidth={1.25} />
            </span>
            <span className="inv-fact-body">
              <span className="inv-fact-main">{content.dressCode}</span>
              <span className="inv-fact-sub">{t.venue.dressCode}</span>
            </span>
          </dd>
        </div>
      )}
    </dl>
  );
}

function Message({ text }: { text: string }) {
  return (
    <div className="inv-message rise-in" style={rise(2)}>
      {text.split(/\n+/).map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}

function Program({ items }: { items: InvitationContent["program"] }) {
  return (
    <details className="inv-program rise-in" style={rise(3)} open={items.length <= PROGRAM_OPEN_UP_TO}>
      <summary>
        <span>{t.program.label}</span>
        <span className="inv-program-count tabular-nums">{fill(t.program.count, { n: items.length })}</span>
        <ChevronDown size={18} strokeWidth={1.25} aria-hidden className="inv-program-chevron" />
      </summary>
      <ol>
        {items.map((item, i) => (
          <li key={i}>
            <span className="tabular-nums text-gilt-fg">{item.time}</span>
            <span>{item.label}</span>
          </li>
        ))}
      </ol>
    </details>
  );
}

type Photo = NonNullable<InvitationContent["photo"]>;

function PhotoImage({ photo, sizes }: { photo: Photo; sizes: string }) {
  return (
    <Image
      src={photo.url}
      alt={t.photoAlt}
      fill
      preload
      sizes={sizes}
      placeholder={photo.blurDataUrl ? "blur" : "empty"}
      blurDataURL={photo.blurDataUrl}
      className="inv-photo object-cover"
      style={photo.focus && { objectPosition: `${photo.focus.x}% ${photo.focus.y}%` }}
    />
  );
}

function Reply({ deadline, rsvp }: { deadline: string; rsvp: InvitationRsvp }) {
  return (
    <section id="reply" aria-labelledby="rsvp-title" className="inv-rsvp rise-in" style={rise(2)}>
      <div className="grid gap-1">
        <h2 id="rsvp-title" className="font-display text-h3">
          {t.rsvp.title}
        </h2>
        <p className="text-small text-fg-muted tabular-nums">{`${t.rsvp.deadline} · ${formatLongDate(deadline)}`}</p>
      </div>
      <RsvpForm strings={t.rsvp} uiLabels={copy.ui} rsvp={rsvp} />
      {rsvp.submit === "demo" ? <p className="text-center text-small text-fg-muted">{t.rsvp.preview}</p> : null}
    </section>
  );
}

function Footer({ surface }: { surface: Look["surface"] }) {
  return (
    <footer className="flex justify-center">
      {/* A plain link: guests shouldn't download the marketing page just by opening an invitation. */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/" className="inline-flex min-h-tap items-center justify-center gap-3 px-4 text-fg-muted">
        <span className="text-small">{t.footer.madeWith}</span>
        <Wordmark height={16} tone={surface} />
      </a>
    </footer>
  );
}
