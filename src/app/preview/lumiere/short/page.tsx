import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/templates/InvitationRenderer";
import { previewEnabled, SAMPLES } from "../../samples";

export const metadata: Metadata = {
  title: "Lumière preview, short",
  robots: { index: false, follow: false, nocache: true },
};

/** Very short names, no photo, no program, no dress code, opened without a guest link. */
export default function LumiereShortPreviewPage() {
  if (!previewEnabled) notFound();
  return (
    <main>
      <InvitationRenderer templateId="lumiere" content={SAMPLES.short} calendarHref="/preview/calendar/short.ics" />
    </main>
  );
}
