import { copy } from "@content/copy.ka";
import { invitationContentSchema } from "@/lib/invitations/schema";
import type { InvitationGuest } from "@/templates/types";

export { devToolsEnabled as previewEnabled } from "@/lib/dev";

// Parsed with the real schema, so a sample that the editor would reject fails loudly here.
export const SAMPLES = {
  full: invitationContentSchema.parse(copy.samples.full),
  short: invitationContentSchema.parse(copy.samples.short),
};

export type SampleId = keyof typeof SAMPLES;

/** A guest who opened their personal link. In previews the RSVP form runs in demo mode: nothing is sent. */
export const SAMPLE_GUEST: InvitationGuest = { ...copy.samples.guest, rsvp: null, closed: false, submit: "demo" };

/** RSVP states the preview can show with ?rsvp=…, for checking each one by eye and in e2e screenshots. */
export const SAMPLE_RSVP_STATES: Record<string, Partial<InvitationGuest>> = {
  yes: { rsvp: { attending: true, partySize: 2 } },
  no: { rsvp: { attending: false, partySize: 0 } },
  closed: { rsvp: { attending: true, partySize: 2 }, closed: true },
  "closed-empty": { closed: true },
};
