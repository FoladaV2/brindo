import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@content/copy.ka";
import { getOwnInvitation } from "@/lib/invitations/access";
import { placeholderDate, previewContent } from "@/lib/invitations/preview";
import { invitationDraftSchema } from "@/lib/invitations/schema";
import { LiveFrame } from "./live-frame";

// The ownership check runs here as well as in the page: metadata blocks before the response
// starts (htmlLimitedBots in next.config.ts), so someone else's id gets a real 404 status.
export async function generateMetadata({ params }: PageProps<"/dashboard/invitations/[id]/frame">): Promise<Metadata> {
  if (!(await getOwnInvitation((await params).id))) notFound();
  return { title: copy.editor.previewFrame, robots: { index: false, follow: false } };
}

/** The editor's live preview, loaded in an iframe. Starts from the saved draft. */
export default function PreviewFramePage({ params }: PageProps<"/dashboard/invitations/[id]/frame">) {
  return (
    <Suspense fallback={<div data-surface="light" className="min-h-svh bg-bg" />}>
      <Frame id={params.then((p) => p.id)} />
    </Suspense>
  );
}

async function Frame({ id }: { id: Promise<string> }) {
  const invitation = await getOwnInvitation(await id);
  if (!invitation) notFound();
  const draft = invitationDraftSchema.safeParse(invitation.content);
  const content = previewContent(draft.success ? draft.data : {}, placeholderDate(new Date()));
  return <LiveFrame templateId={invitation.templateId} content={content} />;
}
