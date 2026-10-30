import type { EventType } from "@/lib/events";
import type { InvitationContent } from "@/lib/invitations/schema";

/** Answering through the invitation's one link (SPEC.md "Open RSVP"). */
export type InvitationRsvp = {
  slug: string;
  /** The most people one answer may bring, the guest included. */
  maxPartySize: number;
  /** The RSVP deadline has passed: answers can no longer be given or changed. */
  closed: boolean;
  /** "live" sends answers to the server; "demo" (previews, the owner's draft) sends nothing. */
  submit: "live" | "demo";
};

export type TemplateProps = {
  content: InvitationContent;
  eventType: EventType;
  /** The RSVP form. Absent where answering makes no sense (link-preview renders, thumbnails). */
  rsvp?: InvitationRsvp;
};
