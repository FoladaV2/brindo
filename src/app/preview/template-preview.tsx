import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InvitationRenderer } from "@/templates/InvitationRenderer";
import { TEMPLATES, type TemplateId } from "@/templates/registry";
import { previewEnabled, SAMPLE_RSVP, SAMPLES } from "./samples";

/** Every template has two previews: /preview/<id> (full sample) and /preview/<id>/short. */
export function previewMetadata(id: TemplateId, short = false): Metadata {
  return {
    title: `${TEMPLATES[id].displayName} preview${short ? ", short" : ""}`,
    robots: { index: false, follow: false, nocache: true },
  };
}

/**
 * Long names, a long address, a full message, photo and program, with the RSVP form in demo mode.
 * ?event=birthday shows a one-title event instead of a couple's; ?rsvp=closed shows the form past
 * the deadline.
 */
export function FullPreview({ id, searchParams }: { id: TemplateId; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  if (!previewEnabled) notFound();
  return (
    <main>
      <Suspense>
        <WithRsvp id={id} query={searchParams} />
      </Suspense>
    </main>
  );
}

async function WithRsvp({ id, query }: { id: TemplateId; query: Promise<Record<string, string | string[] | undefined>> }) {
  const q = await query;
  const birthday = q.event === "birthday";
  const rsvp = { ...SAMPLE_RSVP, slug: `preview-${id}${birthday ? "-birthday" : ""}`, closed: q.rsvp === "closed" };
  return (
    <InvitationRenderer
      templateId={id}
      content={birthday ? SAMPLES.birthday : SAMPLES.full}
      eventType={birthday ? "birthday" : "wedding"}
      rsvp={rsvp}
      calendarHref="/preview/calendar/full.ics"
    />
  );
}

/** Very short names, no photo, no program, no dress code. */
export function ShortPreview({ id }: { id: TemplateId }) {
  if (!previewEnabled) notFound();
  return (
    <main>
      <InvitationRenderer
        templateId={id}
        content={SAMPLES.short}
        eventType="wedding"
        rsvp={{ ...SAMPLE_RSVP, slug: `preview-${id}-short` }}
        calendarHref="/preview/calendar/short.ics"
      />
    </main>
  );
}
