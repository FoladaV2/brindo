import { copy } from "@content/copy.ka";
import { invitationContentSchema } from "@/lib/invitations/schema";
import type { InvitationRsvp } from "@/templates/types";

export { devToolsEnabled as previewEnabled } from "@/lib/dev";

// Parsed with the real schema, so a sample that the editor would reject fails loudly here.
export const SAMPLES = {
  full: invitationContentSchema.parse(copy.samples.full),
  short: invitationContentSchema.parse(copy.samples.short),
  birthday: invitationContentSchema.parse(copy.samples.birthday),
};

export type SampleId = keyof typeof SAMPLES;

/** In previews the RSVP form runs in demo mode: nothing is sent. */
export const SAMPLE_RSVP: InvitationRsvp = { slug: "preview", maxPartySize: 6, closed: false, submit: "demo" };
