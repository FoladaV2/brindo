import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarPlus } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Grain } from "@/templates/ui/Grain";
import { Halo } from "@/templates/ui/Halo";
import { Label } from "@/templates/ui/Label";
import { LightSweep } from "@/templates/ui/LightSweep";
import { Wordmark } from "@/components/brand/Wordmark";
import { widestNameLineEm } from "@/lib/invitations/fit";
import { mapLinks } from "@/lib/invitations/maps";
import { nameParts, titleWords, type InvitationContent } from "@/lib/invitations/schema";
import type { TemplateId } from "../registry";
import type { EventType } from "@/lib/events";
import type { InvitationRsvp, TemplateProps } from "../types";
import { formatDate, formatLongDate } from "./format";
import { RsvpForm } from "./RsvpForm";
import "../invitation.css";

const t = copy.invitation;

/** Matches .inv-title letter-spacing; fitting must count it. */
const TITLE_TRACKING_EM = 0.01;

/**
 * What sets one template apart from another. The layout and components are shared; colors and
 * motion timing come from the surface tokens and the template's own CSS, scoped by [data-template].
 */
export type Look = {
  id: TemplateId;
  surface: "light" | "dark";
  /** The poster's photo: an arched window inside a framed card, or full-bleed under a wash of ink. */
  poster: "arch" | "bleed";
  /** ms before one light sweep crosses the title, or null for none. */
  sweepDelay: number | null;
};

/**
 * One invitation card. A poster (what the event is called, the date, the photo) and one panel with
 * everything a guest needs: when, where, the host's words, the program, and the answer form. On
 * desktop both fill the screen side by side and the page itself never scrolls; on phones they stack
 * into about two screens. Server-rendered; only the answer form runs on the client.
 */
export function Invitation({ look, content, eventType, rsvp, calendarHref }: TemplateProps & { look: Look }) {
  return (
    <article data-surface={look.surface} data-template={look.id} data-poster={look.poster} className="inv isolate bg-bg text-fg">
      <Grain />
      <Poster content={content} eventType={eventType} look={look} />
      <div className="inv-panel">
        <div className="inv-panel-inner">
          {/* On desktop the details take the height the form leaves, and scroll on their own if a host wrote a lot. */}
          <div className="inv-details">
            <div className="inv-details-inner">
              <Facts content={content} calendarHref={calendarHref} />
              <Story message={content.message} program={content.program} />
            </div>
          </div>
          <Rsvp deadline={content.rsvpDeadline} rsvp={rsvp} />
          <Footer surface={look.surface} />
        </div>
      </div>
    </article>
  );
}

const rise = (i: number) => ({ "--i": i }) as CSSProperties;

function Poster({ content, eventType, look }: { content: InvitationContent; eventType: EventType; look: Look }) {
  const date = formatDate(content.startsAt);
  const photo = content.photo;
  return (
    <header className="inv-poster" data-photo={photo ? "" : undefined}>
      {photo && look.poster === "bleed" ? (
        <div className="inv-bleed" aria-hidden>
          <PhotoImage photo={photo} sizes="(min-width: 1024px) 42vw, 100vw" />
        </div>
      ) : (
        <Halo />
      )}
      <div className="inv-poster-card">
        {photo && look.poster === "arch" && (
          <div className="inv-arch rise-in">
            <PhotoImage photo={photo} sizes="(min-width: 1024px) 18rem, 46vw" />
          </div>
        )}
        <div className="inv-poster-copy">
          <div className="rise-in whitespace-nowrap" style={rise(1)}>
            <Label>{t.kickers[eventType]}</Label>
          </div>
          <Title content={content} sweepDelay={look.sweepDelay} />
          <div className="inv-dateline rise-in" style={rise(3)}>
            <span aria-hidden className="inv-rule" />
            <Label>{`${date.weekday} · ${date.day} ${date.month} ${date.year}`}</Label>
            <span aria-hidden className="inv-rule" />
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * The event's name, as large as the poster allows: two names around an ampersand, or one title.
 * Lines break naturally; the size comes from the widest word (so no word ever overflows) and from
 * the height the poster leaves (so the poster never grows past its share of the screen).
 */
function Title({ content, sweepDelay }: { content: Pick<InvitationContent, "partners" | "title">; sweepDelay: number | null }) {
  const words = titleWords(content).flatMap(nameParts).length;
  const style = {
    "--fit": (widestNameLineEm(titleWords(content), TITLE_TRACKING_EM) * 1.03).toFixed(3),
    "--lines": words + (content.partners ? 0.6 : 0),
  } as CSSProperties;
  const lines = content.partners ? (
    <>
      <span className="inv-title-line">{content.partners[0]}</span>
      <span className="inv-amp">{t.ampersand}</span>
      <span className="inv-title-line">{content.partners[1]}</span>
    </>
  ) : (
    <span className="inv-title-line">{content.title}</span>
  );
  return (
    <div className="inv-title-frame rise-in" style={rise(2)}>
      <h1 className="inv-title font-display" style={style}>
        {sweepDelay === null ? lines : <LightSweep delay={sweepDelay}>{lines}</LightSweep>}
      </h1>
    </div>
  );
}

function Facts({ content, calendarHref }: { content: InvitationContent; calendarHref: string }) {
  const date = formatDate(content.startsAt);
  const links = mapLinks(content.venue);
  return (
    <div className="inv-facts rise-in" style={rise(2)}>
      <div className="inv-fact inv-fact-when">
        <Label as="h2">{t.date.label}</Label>
        <p className="inv-when">
          <span className="inv-day font-display tabular-nums">{date.day}</span>
          <span className="flex flex-col">
            <span className="font-display text-fact">{`${date.month} ${date.year}`}</span>
            <span className="text-small text-fg-muted tabular-nums">{`${date.weekday} · ${date.time}`}</span>
          </span>
        </p>
        <a href={calendarHref} className="inv-link">
          <CalendarPlus size={16} strokeWidth={1.25} aria-hidden />
          {t.date.addToCalendar}
        </a>
      </div>
      <div className="inv-fact inv-fact-where">
        <Label as="h2">{t.venue.label}</Label>
        <p className="font-display text-fact">{content.venue.name}</p>
        <address className="flex flex-col text-small text-fg-muted not-italic">
          {content.venue.address.split(/\n+/).map((line, i) => (
            <span key={i}>{line}</span>
          ))}
        </address>
        <div className="flex flex-wrap gap-x-5">
          {[
            [links.google, t.venue.googleMaps],
            [links.apple, t.venue.appleMaps],
          ].map(([href, label]) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inv-link">
              {label}
              <ArrowUpRight size={14} strokeWidth={1.25} aria-hidden />
            </a>
          ))}
        </div>
      </div>
      {content.dressCode && (
        <div className="inv-fact inv-fact-dress">
          <Label as="h2">{t.venue.dressCode}</Label>
          <p className="font-display text-fact">{content.dressCode}</p>
        </div>
      )}
    </div>
  );
}

/** The host's words and the program, side by side on wide screens. */
function Story({ message, program }: { message?: string; program: InvitationContent["program"] }) {
  if (!message && program.length === 0) return null;
  return (
    <div className="inv-story rise-in" style={rise(3)}>
      {message && (
        <div className="inv-message">
          {message.split(/\n+/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
      )}
      {program.length > 0 && (
        <div className="inv-fact">
          <Label as="h2">{t.program.label}</Label>
          <ol className="inv-program">
            {program.map((item, i) => (
              <li key={i}>
                <span className="tabular-nums text-gilt-fg">{item.time}</span>
                <span>{item.label}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
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

function Rsvp({ deadline, rsvp }: { deadline: string; rsvp?: InvitationRsvp }) {
  if (!rsvp) return null;
  return (
    <section aria-labelledby="rsvp-title" className="inv-rsvp rise-in" style={rise(5)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <h2 id="rsvp-title" className="font-display text-h3">
          {t.rsvp.title}
        </h2>
        <p className="text-small text-fg-muted tabular-nums">{`${t.rsvp.deadline} · ${formatLongDate(deadline)}`}</p>
      </div>
      <div className="mt-1">
        <RsvpForm strings={t.rsvp} uiLabels={copy.ui} rsvp={rsvp} />
        {rsvp.submit === "demo" ? <p className="mt-4 text-center text-small text-fg-muted">{t.rsvp.preview}</p> : null}
      </div>
    </section>
  );
}

function Footer({ surface }: { surface: Look["surface"] }) {
  return (
    <footer className="flex justify-center">
      <Link href="/" className="inline-flex min-h-tap items-center justify-center gap-3 px-4 text-fg-muted">
        <span className="text-small">{t.footer.madeWith}</span>
        <Wordmark height={16} tone={surface} />
      </Link>
    </footer>
  );
}
