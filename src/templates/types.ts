import type { InvitationContent } from "@/lib/invitations/schema";

/** The guest a personal link belongs to. Absent on the public page without a token and in previews. */
export type InvitationGuest = {
  name: string;
  maxPartySize: number;
  /** The guest's saved answer, if they have replied. */
  rsvp: { attending: boolean; partySize: number } | null;
  /** The RSVP deadline has passed: the saved answer can no longer change. */
  closed: boolean;
  /** Where answers go: the guest's personal link, or "demo" in previews (nothing is sent). */
  submit: { slug: string; token: string } | "demo";
};

export type TemplateProps = {
  content: InvitationContent;
  guest?: InvitationGuest;
  /** Where "Add to calendar" downloads the .ics file from. Depends on the page hosting the invitation. */
  calendarHref: string;
};
