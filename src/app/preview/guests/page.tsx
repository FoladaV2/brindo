import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@content/copy.ka";
import { SectionHeader } from "@/templates/ui/SectionHeader";
import type { OverviewGuest } from "@/lib/guests/overview";
import { fill } from "@/lib/text";
import { formatLongDate } from "@/templates/shared/format";
import { DashboardShell } from "../../dashboard/shell";
import { GuestOverview } from "../../dashboard/invitations/[id]/guests/overview";
import { previewEnabled, SAMPLES } from "../samples";

export const metadata: Metadata = {
  title: "Guest overview preview",
  robots: { index: false, follow: false, nocache: true },
};

const GUESTS: OverviewGuest[] = copy.samples.guestList.map(([name, maxPartySize, answer], i) => ({
  id: `sample-${i}`,
  name,
  maxPartySize,
  token: `sample-token-${String(i).padStart(2, "0")}-xxxxxxxxxxxxxxxxxxxxxxxx`,
  status: answer === null ? "awaiting" : answer > 0 ? "confirmed" : "declined",
  partySize: answer ?? 0,
}));

/** The couple's guest overview with sample answers, to check the layout without a database. */
export default function GuestOverviewPreviewPage() {
  if (!previewEnabled) notFound();
  const [a, b] = SAMPLES.full.partners;
  return (
    <DashboardShell>
      <section className="mx-auto max-w-[64rem] px-gutter pt-6 pb-section sm:pt-10">
        <div className="mt-8 sm:mt-12">
          <SectionHeader as="h1" align="start" label={`${a} ${copy.invitation.ampersand} ${b}`} title={copy.guestsOverview.heading} />
        </div>
        <GuestOverview
          guests={GUESTS}
          slug="preview"
          siteUrl="https://brindo.ge"
          published
          reminder={fill(copy.guestsOverview.remind.message, { deadline: formatLongDate(SAMPLES.full.rsvpDeadline) })}
          addGuestsHref="#"
        />
      </section>
    </DashboardShell>
  );
}
