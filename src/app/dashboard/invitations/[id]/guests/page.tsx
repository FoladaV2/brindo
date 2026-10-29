import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { copy } from "@content/copy.ka";
import { SectionHeader } from "@/templates/ui/SectionHeader";
import { listGuestOverview } from "@/lib/guests/access";
import { currentUserId, getOwnInvitation } from "@/lib/invitations/access";
import { invitationDraftSchema } from "@/lib/invitations/schema";
import { fill } from "@/lib/text";
import { formatLongDate } from "@/templates/shared/format";
import { DashboardShell } from "../../../shell";
import { GuestOverview } from "./overview";

const t = copy.guestsOverview;

// The ownership check runs here as well as in the page: metadata blocks before the response
// starts (htmlLimitedBots in next.config.ts), so someone else's id gets a real 404 status.
export async function generateMetadata({ params }: PageProps<"/dashboard/invitations/[id]/guests">): Promise<Metadata> {
  if (!(await getOwnInvitation((await params).id))) notFound();
  return { title: t.title, robots: { index: false, follow: false } };
}

/** Who is coming: a summary, the guest list with each answer, and a reminder helper. Read-only. */
export default function GuestsOverviewPage({ params }: PageProps<"/dashboard/invitations/[id]/guests">) {
  return (
    <DashboardShell>
      <section className="mx-auto max-w-[64rem] px-gutter pt-6 pb-section sm:pt-10">
        <Link href="/dashboard" className="inline-flex min-h-tap items-center gap-2 text-small text-fg-muted hover:text-fg">
          <ArrowLeft size={16} strokeWidth={1.25} aria-hidden />
          {t.back}
        </Link>
        <Suspense fallback={<div className="min-h-[60svh]" />}>
          <Overview id={params.then((p) => p.id)} />
        </Suspense>
      </section>
    </DashboardShell>
  );
}

async function Overview({ id }: { id: Promise<string> }) {
  if (!(await currentUserId())) redirect("/login");
  const invitation = await getOwnInvitation(await id);
  if (!invitation) notFound();
  const guests = await listGuestOverview(invitation.id);

  const draft = invitationDraftSchema.safeParse(invitation.content);
  const content = draft.success ? draft.data : {};
  const [a, b] = [content.partners?.[0], content.partners?.[1]].map((n, i) => n ?? copy.editor.placeholders.partners[i]);
  const reminder = content.rsvpDeadline
    ? fill(t.remind.message, { deadline: formatLongDate(content.rsvpDeadline) })
    : t.remind.messageNoDeadline;

  return (
    <>
      <div className="mt-8 flex flex-col items-start gap-8 sm:mt-12 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeader as="h1" align="start" label={`${a} ${copy.invitation.ampersand} ${b}`} title={t.heading} />
        <Link href={`/dashboard/invitations/${invitation.id}/edit?tab=guests`} className="btn btn-secondary">
          <span className="btn-label">{t.editList}</span>
        </Link>
      </div>
      <GuestOverview
        guests={guests}
        slug={invitation.slug}
        siteUrl={process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}
        published={invitation.status === "published"}
        reminder={reminder}
        addGuestsHref={`/dashboard/invitations/${invitation.id}/edit?tab=guests`}
      />
    </>
  );
}
