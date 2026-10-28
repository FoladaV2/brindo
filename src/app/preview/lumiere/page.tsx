import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/templates/InvitationRenderer";
import { previewEnabled, SAMPLE_GUEST, SAMPLE_RSVP_STATES, SAMPLES } from "../samples";

export const metadata: Metadata = {
  title: "Lumière preview",
  robots: { index: false, follow: false, nocache: true },
};

/**
 * Long names, a long address, a full message, photo and program, opened by a guest.
 * ?rsvp=yes|no|closed|closed-empty shows the RSVP section after an answer or past the deadline.
 */
export default function LumierePreviewPage({ searchParams }: PageProps<"/preview/lumiere">) {
  if (!previewEnabled) notFound();
  return (
    <main>
      <Suspense>
        <Preview state={searchParams.then((s) => s.rsvp)} />
      </Suspense>
    </main>
  );
}

async function Preview({ state }: { state: Promise<string | string[] | undefined> }) {
  const key = await state;
  const guest = { ...SAMPLE_GUEST, ...(typeof key === "string" && Object.hasOwn(SAMPLE_RSVP_STATES, key) ? SAMPLE_RSVP_STATES[key] : undefined) };
  return <InvitationRenderer templateId="lumiere" content={SAMPLES.full} guest={guest} calendarHref="/preview/calendar/full.ics" />;
}
