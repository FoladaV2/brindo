import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/templates/InvitationRenderer";
import { TEMPLATES, type TemplateId } from "@/templates/registry";
import { previewEnabled, SAMPLE_GUEST, SAMPLE_RSVP_STATES, SAMPLES } from "./samples";

/** Every template has two previews: /preview/<id> (full sample) and /preview/<id>/short. */
export function previewMetadata(id: TemplateId, short = false): Metadata {
  return {
    title: `${TEMPLATES[id].displayName} preview${short ? ", short" : ""}`,
    robots: { index: false, follow: false, nocache: true },
  };
}

/**
 * Long names, a long address, a full message, photo and program, opened by a guest.
 * ?rsvp=yes|no|closed|closed-empty shows the RSVP section after an answer or past the deadline.
 */
export function FullPreview({ id, searchParams }: { id: TemplateId; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!previewEnabled) notFound();
  return (
    <main>
      <Suspense>
        <WithGuest id={id} state={searchParams.then((s) => s.rsvp)} />
      </Suspense>
    </main>
  );
}

async function WithGuest({ id, state }: { id: TemplateId; state: Promise<string | string[] | undefined> }) {
  const key = await state;
  const guest = { ...SAMPLE_GUEST, ...(typeof key === "string" && Object.hasOwn(SAMPLE_RSVP_STATES, key) ? SAMPLE_RSVP_STATES[key] : undefined) };
  return <InvitationRenderer templateId={id} content={SAMPLES.full} guest={guest} calendarHref="/preview/calendar/full.ics" />;
}

/** Very short names, no photo, no program, no dress code, opened without a guest link. */
export function ShortPreview({ id }: { id: TemplateId }) {
  if (!previewEnabled) notFound();
  return (
    <main>
      <InvitationRenderer templateId={id} content={SAMPLES.short} calendarHref="/preview/calendar/short.ics" />
    </main>
  );
}
