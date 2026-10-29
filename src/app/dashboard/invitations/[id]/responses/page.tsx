import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { copy } from "@content/copy.ka";
import { currentUserId, getOwnInvitation } from "@/lib/invitations/access";
import { draftTitle, invitationDraftSchema } from "@/lib/invitations/schema";
import { listResponses } from "@/lib/responses/access";
import { DashboardShell } from "../../../shell";
import { ResponsesView } from "./responses-view";

// The ownership check runs here as well as in the page: metadata blocks before the response
// starts (htmlLimitedBots in next.config.ts), so someone else's id gets a real 404 status.
export async function generateMetadata({ params }: PageProps<"/dashboard/invitations/[id]/responses">): Promise<Metadata> {
  if (!(await getOwnInvitation((await params).id))) notFound();
  return { title: copy.responses.title, robots: { index: false, follow: false } };
}

export default function ResponsesPage({ params }: PageProps<"/dashboard/invitations/[id]/responses">) {
  return (
    <DashboardShell>
      <Suspense fallback={<div className="min-h-dvh" />}>
        <Responses id={params.then((p) => p.id)} />
      </Suspense>
    </DashboardShell>
  );
}

/** The answers to one of the host's invitations. RLS returns no one else's. */
async function Responses({ id }: { id: Promise<string> }) {
  if (!(await currentUserId())) redirect("/login");
  const invitation = await getOwnInvitation(await id);
  if (!invitation) notFound();
  const draft = invitationDraftSchema.safeParse(invitation.content);
  const title = (draft.success && draftTitle(draft.data, copy.invitation.ampersand)) || copy.events.types[invitation.eventType];
  const responses = await listResponses(invitation.id);
  return <ResponsesView invitationId={invitation.id} title={title} responses={responses} />;
}
