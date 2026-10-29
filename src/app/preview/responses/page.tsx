import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@content/copy.ka";
import type { HostResponse } from "@/lib/responses/summary";
import { DashboardShell } from "../../dashboard/shell";
import { ResponsesView } from "../../dashboard/invitations/[id]/responses/responses-view";
import { previewEnabled } from "../samples";

export const metadata: Metadata = {
  title: "Responses preview",
  robots: { index: false, follow: false, nocache: true },
};

const RESPONSES: HostResponse[] = copy.samples.responses.map(([firstName, lastName, partySize], i) => {
  const at = new Date(Date.UTC(2027, 4, 20 - i, 10)).toISOString();
  return { id: `sample-${i}`, firstName, lastName, attending: partySize !== null, partySize, createdAt: at, updatedAt: at };
});

/** The host's answers page with sample answers, to check the layout without a database. */
export default function ResponsesPreviewPage() {
  if (!previewEnabled) notFound();
  return (
    <DashboardShell>
      <ResponsesView invitationId="00000000-0000-4000-8000-000000000000" title={copy.samples.birthday.title} responses={RESPONSES} demo />
    </DashboardShell>
  );
}
