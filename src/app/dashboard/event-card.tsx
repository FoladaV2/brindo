import Link from "next/link";
import { ArrowUpRight, Pencil, Users } from "lucide-react";
import { copy } from "@content/copy.ka";
import { LogoMark } from "@/components/brand/logo";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonArrow } from "@/components/ui/button";
import type { OwnInvitation } from "@/lib/invitations/access";
import { draftTitle, invitationDraftSchema } from "@/lib/invitations/schema";
import { fill } from "@/lib/text";
import { formatDate } from "@/templates/shared/format";
import { CopyLinkButton } from "./copy-link-button";

const t = copy.dashboard;

/** No events yet: one calm invitation to create the first. */
export function Empty() {
  return (
    <div className="grid justify-items-center gap-5 rounded-2xl border border-border bg-card px-6 py-16 text-center sm:py-24">
      <LogoMark size={44} />
      <h2 className="font-display text-heading">{t.empty.heading}</h2>
      <p className="max-w-md text-muted-foreground">{t.empty.body}</p>
      <Button asChild size="lg">
        <Link href="/dashboard/invitations/new">
          {t.empty.cta} <ButtonArrow />
        </Link>
      </Button>
    </div>
  );
}

/** One event: type, title, date, and what to do next (live: answers and the link; draft: keep editing). */
export function EventCard({ invitation, count, url }: { invitation: OwnInvitation; count?: { people: number; replies: number }; url: string }) {
  const draft = invitationDraftSchema.safeParse(invitation.content);
  const content = draft.success ? draft.data : {};
  const title = draftTitle(content, copy.invitation.ampersand) || t.untitled;
  const date = content.startsAt && formatDate(content.startsAt);
  const live = invitation.status !== "draft";
  const base = `/dashboard/invitations/${invitation.id}`;

  return (
    <article className="flex h-full flex-col gap-6 rounded-xl border border-border bg-card p-6 sm:p-7">
      <div className="flex flex-wrap items-center gap-2">
        {live ? <Badge>{t.status.published}</Badge> : <Badge variant="secondary">{t.status.draft}</Badge>}
        <span className="text-sm text-muted-foreground">{copy.events.types[invitation.eventType]}</span>
      </div>
      <div className="grid gap-1.5">
        <h2 className="font-display text-heading text-balance">{title}</h2>
        <p className="text-sm text-muted-foreground tabular">{date ? `${date.weekday}, ${date.day} ${date.month} ${date.year} · ${date.time}` : t.noDate}</p>
      </div>

      {live ? (
        <Link href={`${base}/responses`} className="group/stat grid grid-cols-2 gap-4 rounded-lg bg-sunken p-4 hover:bg-selected">
          <span className="grid">
            <span className="font-display text-title leading-none tabular">{count?.people ?? 0}</span>
            <span className="text-sm text-muted-foreground">{t.card.coming}</span>
          </span>
          <span className="grid">
            <span className="font-display text-title leading-none tabular">{count?.replies ?? 0}</span>
            <span className="text-sm text-muted-foreground">{t.card.replies}</span>
          </span>
        </Link>
      ) : (
        <p className="rounded-lg bg-sunken p-4 text-sm text-muted-foreground">{t.card.draftHint}</p>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-5">
        {live ? (
          <>
            <Button asChild size="sm">
              <Link href={`${base}/responses`}>
                <Users strokeWidth={1.75} /> {t.card.responses}
              </Link>
            </Button>
            <CopyLinkButton url={url} label={t.card.copyLink} copiedLabel={t.card.copied} />
            <Button asChild variant="ghost" size="sm">
              <Link href={`${base}/edit`} aria-label={`${t.card.edit}: ${title}`}>
                <Pencil strokeWidth={1.75} /> {t.card.edit}
              </Link>
            </Button>
          </>
        ) : (
          <>
            <Button asChild size="sm">
              <Link href={`${base}/edit`}>
                {t.card.continue} <ButtonArrow />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <a href={`/i/${invitation.slug}`} target="_blank" rel="noopener">
                {t.card.preview} <ArrowUpRight strokeWidth={1.75} />
              </a>
            </Button>
          </>
        )}
      </div>
      {live && count ? <span className="sr-only">{fill(t.card.summary, { people: count.people, replies: count.replies })}</span> : null}
    </article>
  );
}
