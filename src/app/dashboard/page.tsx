import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Chip } from "@/components/ui/Chip";
import { Divider } from "@/components/ui/Divider";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { listOwnInvitations, type OwnInvitation } from "@/lib/invitations/access";
import { invitationDraftSchema } from "@/lib/invitations/schema";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/templates/shared/format";
import { DashboardShell } from "./shell";

const t = copy.dashboard;

export const metadata: Metadata = {
  title: t.title,
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return (
    <DashboardShell>
      <section className="mx-auto max-w-[1200px] px-gutter pt-12 pb-section sm:pt-20">
        <div className="flex flex-col items-start gap-10 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeader as="h1" align="start" label={t.label} title={t.heading} />
          <CreateButton />
        </div>
        <Suspense fallback={<div className="mt-16 h-64" />}>
          <Invitations />
        </Suspense>
      </section>
    </DashboardShell>
  );
}

function CreateButton() {
  return (
    <Link href="/dashboard/invitations/new" className="btn btn-primary">
      <span className="btn-label">
        <Plus size={18} strokeWidth={1.25} aria-hidden />
        {t.create}
      </span>
    </Link>
  );
}

async function Invitations() {
  // getUser asks the auth server, so a revoked session is caught even if the proxy let it through.
  const { data } = await (await createClient()).auth.getUser();
  if (!data.user) redirect("/login");
  const invitations = await listOwnInvitations();

  return (
    <>
      {invitations.length === 0 ? (
        <div className="mt-20 flex flex-col items-center text-center">
          <Divider className="w-full max-w-[20rem]" />
          <p className="mt-12 max-w-[30ch] font-display text-h3 text-balance">{t.empty}</p>
        </div>
      ) : (
        <ul className="mt-16 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
          {invitations.map((invitation) => (
            <li key={invitation.id}>
              <InvitationCard invitation={invitation} />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-20 text-small text-fg-muted">
        {t.signedInAs} <span className="break-all text-fg">{data.user.email}</span>
      </p>
    </>
  );
}

function InvitationCard({ invitation }: { invitation: OwnInvitation }) {
  const draft = invitationDraftSchema.safeParse(invitation.content);
  const content = draft.success ? draft.data : {};
  const [a, b] = [content.partners?.[0], content.partners?.[1]].map((n, i) => n ?? copy.editor.placeholders.partners[i]);
  const date = content.startsAt && formatDate(content.startsAt);

  return (
    <article className="flex h-full flex-col rounded-card border border-hairline bg-raised p-6 sm:p-8">
      <Chip dot={invitation.status === "published" ? "filled" : "hollow"} className="self-start">{t.status[invitation.status]}</Chip>
      <h2 className="mt-8 font-display text-h3 text-balance">
        {a} <span className="text-accent">{copy.invitation.ampersand}</span> {b}
      </h2>
      <p className="mt-3 text-small text-fg-muted tabular-nums">
        {date ? `${date.weekday}, ${date.day} ${date.month} ${date.year} · ${date.time}` : t.noDate}
      </p>
      <div aria-hidden className="min-h-10 flex-1" />
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-hairline pt-6">
        <Link href={`/dashboard/invitations/${invitation.id}/edit`} className="btn btn-secondary">
          <span className="btn-label">{t.edit}</span>
        </Link>
        <Link href={`/dashboard/invitations/${invitation.id}/guests`} className="inline-flex min-h-tap items-center text-ui text-fg hover:text-accent-fg">
          {t.guests}
        </Link>
        <a
          href={`/i/${invitation.slug}`}
          target="_blank"
          rel="noopener"
          className="inline-flex min-h-tap items-center gap-2 text-ui text-fg hover:text-accent-fg"
        >
          {t.preview}
          <ArrowUpRight size={16} strokeWidth={1.25} aria-hidden />
        </a>
      </div>
    </article>
  );
}
