import type { CSSProperties } from "react";
import Image from "next/image";
import { ArrowUpRight, CalendarPlus } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Divider } from "@/components/ui/Divider";
import { Grain } from "@/components/ui/Grain";
import { Halo } from "@/components/ui/Halo";
import { Label } from "@/components/ui/Label";
import { LightSweep } from "@/components/ui/LightSweep";
import { Reveal } from "@/components/ui/Reveal";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TextUnveil } from "@/components/ui/TextUnveil";
import { Wordmark } from "@/components/ui/Wordmark";
import { eventInstant } from "@/lib/invitations/datetime";
import { widestNameLineEm } from "@/lib/invitations/fit";
import { mapLinks } from "@/lib/invitations/maps";
import { nameParts, type InvitationContent } from "@/lib/invitations/schema";
import { fill } from "@/lib/text";
import { Countdown } from "../shared/Countdown";
import { formatDate, formatLongDate } from "../shared/format";
import { Parallax } from "../shared/Parallax";
import { RsvpForm } from "../shared/RsvpForm";
import type { InvitationGuest, TemplateProps } from "../types";
import "../invitation.css";

const t = copy.invitation;

/** Matches .inv-names letter-spacing; fitting must count it. */
const NAMES_TRACKING_EM = 0.01;

/**
 * Lumière: the light template. Morning light in a gallery: ivory, ink, champagne hairlines, a lot of air.
 * Server-rendered; only the countdown, scroll reveals, photo parallax and RSVP form run on the client.
 */
export function Lumiere({ content, guest, calendarHref }: TemplateProps) {
  return (
    <article data-surface="light" className="relative isolate bg-bg text-fg">
      <Grain />
      <Hero content={content} />
      {content.message && <Message text={content.message} />}
      <DateAndCountdown startsAt={content.startsAt} calendarHref={calendarHref} />
      <Venue venue={content.venue} dressCode={content.dressCode} />
      {content.program.length > 0 && <Program items={content.program} />}
      {content.photo && <Photo photo={content.photo} />}
      <Rsvp deadline={content.rsvpDeadline} guest={guest} />
      <Footer />
    </article>
  );
}

function Hero({ content }: { content: InvitationContent }) {
  const [a, b] = content.partners;
  const lines = [
    ...nameParts(a),
    <span key="amp" className="inv-amp">
      {t.ampersand}
    </span>,
    ...nameParts(b),
  ];
  const nameLines = lines.length - 1;
  // Names fill the width but never overflow it (see .inv-names), and the whole hero fits one screen.
  const fit = {
    "--fit": (widestNameLineEm(content.partners, NAMES_TRACKING_EM) * 1.03).toFixed(3),
    "--lines": nameLines + 0.6,
  } as CSSProperties;
  const date = formatDate(content.startsAt);

  return (
    <header className="relative flex min-h-svh flex-col items-center overflow-clip text-center">
      <Halo drift />
      <div className="relative flex w-full flex-1 flex-col items-center justify-center px-gutter pt-20 pb-16">
        <div className="rise-in whitespace-nowrap">
          <Label>{t.kicker}</Label>
        </div>
        <div className="inv-names-frame mt-8 sm:mt-10">
          <h1 className="inv-names font-display" style={fit}>
            <LightSweep delay={400}>
              <TextUnveil as="span" delay={120} lines={lines} />
            </LightSweep>
          </h1>
        </div>
        <div className="rise-in mt-10 flex items-center gap-4 sm:mt-12" style={{ "--i": nameLines + 4 } as CSSProperties}>
          <span aria-hidden className="hidden h-px w-8 bg-accent sm:block" />
          <Label>{`${date.weekday} · ${date.day} ${date.month} ${date.year}`}</Label>
          <span aria-hidden className="hidden h-px w-8 bg-accent sm:block" />
        </div>
      </div>
      <span aria-hidden className="inv-cue" />
    </header>
  );
}

function Message({ text }: { text: string }) {
  return (
    <section className="px-gutter py-section">
      <Reveal className="mx-auto flex max-w-[40rem] flex-col items-center text-center">
        <Divider ornament="diamond" className="w-24" />
        <div className="inv-message mt-12">
          {text.split(/\n+/).map((paragraph, i) => (
            <p key={i}>{paragraph}</p>
          ))}
        </div>
        <Divider ornament="diamond" className="mt-12 w-24" />
      </Reveal>
    </section>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-4">
      <span aria-hidden className="h-px w-10 bg-accent" />
      <Label>{children}</Label>
      <span aria-hidden className="h-px w-10 bg-accent" />
    </div>
  );
}

function DateAndCountdown({ startsAt, calendarHref }: { startsAt: string; calendarHref: string }) {
  const date = formatDate(startsAt);
  return (
    <section className="px-gutter pb-section">
      <Reveal className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
        <Eyebrow>{t.date.label}</Eyebrow>
        <h2 className="mt-12 flex flex-col items-center">
          <Label>{date.weekday}</Label>
          <span className="inv-day mt-4 font-display tabular-nums">{date.day}</span>
          <span className="mt-2 font-display text-h3">{`${date.month} ${date.year}`}</span>
        </h2>
        <span aria-hidden className="mt-8 h-8 w-px bg-hairline" />
        <p className="mt-6 font-display text-h3 tabular-nums">{date.time}</p>

        <div className="mt-16 flex w-full flex-col items-center gap-6">
          <Label>{t.date.countdownLabel}</Label>
          <Countdown target={eventInstant(startsAt)} units={t.date.units} label={t.date.countdownLabel} className="w-full max-w-[34rem]" />
        </div>

        <a href={calendarHref} className="btn btn-secondary mt-14">
          <span className="btn-label">
            <CalendarPlus size={18} strokeWidth={1.25} aria-hidden />
            {t.date.addToCalendar}
          </span>
        </a>
      </Reveal>
    </section>
  );
}

function Venue({ venue, dressCode }: { venue: InvitationContent["venue"]; dressCode?: string }) {
  const links = mapLinks(venue);
  return (
    <section className="border-t border-hairline px-gutter py-section">
      <Reveal className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
        <SectionHeader label={t.venue.label} title={venue.name} />
        <address className="mt-8 flex flex-col gap-1 text-body text-fg-muted not-italic">
          {venue.address.split(/\n+/).map((line, i) => (
            <span key={i} className="text-balance">
              {line}
            </span>
          ))}
        </address>
        <div className="mt-12 flex w-full max-w-[20rem] flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row">
          {[
            [links.google, t.venue.googleMaps],
            [links.apple, t.venue.appleMaps],
          ].map(([href, label]) => (
            <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
              <span className="btn-label">
                {label}
                <ArrowUpRight size={16} strokeWidth={1.25} aria-hidden />
              </span>
            </a>
          ))}
        </div>
        {dressCode && (
          <p className="mt-16 flex flex-col items-center gap-3">
            <Label>{t.venue.dressCode}</Label>
            <span className="font-display text-h3">{dressCode}</span>
          </p>
        )}
      </Reveal>
    </section>
  );
}

function Program({ items }: { items: InvitationContent["program"] }) {
  return (
    <section className="border-t border-hairline px-gutter py-section">
      <Reveal className="mx-auto flex max-w-[44rem] flex-col items-center">
        <SectionHeader label={t.program.label} title={t.program.title} />
        <ol className="inv-timeline mt-16 w-full max-w-[26rem]">
          {items.map((item, i) => (
            <li key={i} className="inv-timeline-item">
              <span className="font-display text-h3 tabular-nums">{item.time}</span>
              <span className="inv-timeline-node" aria-hidden>
                <span className="divider-ring" />
              </span>
              <span className="text-body">{item.label}</span>
            </li>
          ))}
        </ol>
      </Reveal>
    </section>
  );
}

function Photo({ photo }: { photo: NonNullable<InvitationContent["photo"]> }) {
  return (
    <figure className="inv-photo">
      <Parallax>
        <Image
          src={photo.url}
          alt={t.photoAlt}
          fill
          sizes="100vw"
          placeholder={photo.blurDataUrl ? "blur" : "empty"}
          blurDataURL={photo.blurDataUrl}
          className="object-cover"
          style={photo.focus && { objectPosition: `${photo.focus.x}% ${photo.focus.y}%` }}
        />
      </Parallax>
      <span aria-hidden className="inv-photo-frame" />
    </figure>
  );
}

function Rsvp({ deadline, guest }: { deadline: string; guest?: InvitationGuest }) {
  return (
    <section data-surface="light" className="relative isolate overflow-clip bg-raised px-gutter py-section">
      <Halo tone="champagne" />
      <Grain />
      <Reveal className="relative mx-auto flex max-w-[32rem] flex-col items-center text-center">
        {guest && (
          <>
            <div className="flex flex-col items-center gap-3">
              <Label>{t.rsvp.personal}</Label>
              <p className="font-display text-h3 text-balance">{guest.name}</p>
              <p className="mt-1 max-w-[30ch] text-body text-fg-muted">{t.rsvp.greeting}</p>
              <p className="text-small text-accent-fg tabular-nums">
                {guest.maxPartySize === 1 ? t.rsvp.invitedForOne : fill(t.rsvp.invitedFor, { n: guest.maxPartySize })}
              </p>
            </div>
            <span aria-hidden className="my-10 h-12 w-px bg-hairline" />
          </>
        )}
        <SectionHeader label={t.rsvp.label} title={t.rsvp.title} />
        <p className="mt-6 text-small text-fg-muted">{`${t.rsvp.deadline} · ${formatLongDate(deadline)}`}</p>
        <div className="mt-14 w-full">
          {guest ? (
            <RsvpForm strings={t.rsvp} uiLabels={copy.ui} guest={guest} />
          ) : (
            <p className="mx-auto max-w-[30ch] text-body text-fg-muted">{t.rsvp.noGuest}</p>
          )}
        </div>
      </Reveal>
    </section>
  );
}

function Footer() {
  return (
    <footer className="flex justify-center px-gutter py-16">
      <a href="/" className="flex min-h-tap flex-col items-center justify-center gap-3 px-4 text-fg-muted">
        <span className="text-small">{t.footer.madeWith}</span>
        <Wordmark height={20} tone="light" />
      </a>
    </footer>
  );
}
