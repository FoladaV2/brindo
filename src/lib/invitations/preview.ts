import { copy } from "@content/copy.ka";
import { invitationContentSchema, type InvitationContent, type InvitationDraft } from "./schema";

const p = copy.editor.placeholders;

/**
 * Content for previewing a draft: what the couple filled in, with neutral placeholders where a
 * required field is still empty. Incomplete program rows are left out, and an RSVP deadline after
 * the event falls back to the event day. `fallbackDate` (YYYY-MM-DDTHH:MM) stands in for a missing date.
 */
export function previewContent(draft: InvitationDraft, fallbackDate: string): InvitationContent {
  const startsAt = draft.startsAt ?? fallbackDate;
  const eventDay = startsAt.slice(0, 10);
  return invitationContentSchema.parse({
    partners: [draft.partners?.[0] ?? p.partners[0], draft.partners?.[1] ?? p.partners[1]],
    startsAt,
    venue: {
      name: draft.venue?.name ?? p.venueName,
      address: draft.venue?.address ?? p.address,
      city: draft.venue?.city ?? p.city,
      mapQuery: draft.venue?.mapQuery,
    },
    message: draft.message,
    photo: draft.photo,
    program: (draft.program ?? []).filter((row) => row.time && row.label),
    rsvpDeadline: draft.rsvpDeadline && draft.rsvpDeadline <= eventDay ? draft.rsvpDeadline : eventDay,
    dressCode: draft.dressCode,
  });
}

/** A stand-in event date six months after `from`, at 18:00. */
export function placeholderDate(from: Date): string {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 6, from.getUTCDate()));
  return `${d.toISOString().slice(0, 10)}T18:00`;
}
