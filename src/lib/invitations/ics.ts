import type { InvitationContent } from "./schema";
import { eventInstant } from "./datetime";

/** Content has a start time only. Calendars get a block long enough to cover a wedding evening. */
const DEFAULT_DURATION_MS = 6 * 60 * 60 * 1000;

type IcsOptions = {
  /** Stable per invitation, so re-adding updates the same calendar entry instead of duplicating it. */
  uid: string;
  title: string;
  /** When the file was generated (DTSTAMP). */
  stamp: number;
  url?: string;
};

/** RFC 5545 date-time in UTC: 20270612T130000Z */
function utc(ms: number) {
  return new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** Escape a TEXT value: backslash, semicolon, comma and newlines. */
function escapeText(s: string) {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** Fold a content line at 75 octets (UTF-8), never splitting a character. */
function fold(lineText: string) {
  const encoder = new TextEncoder();
  const out: string[] = [];
  let current = "";
  let bytes = 0;
  for (const ch of lineText) {
    const size = encoder.encode(ch).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with a space
    if (bytes + size > limit) {
      out.push(current);
      current = "";
      bytes = 0;
    }
    current += ch;
    bytes += size;
  }
  out.push(current);
  return out.join("\r\n ");
}

/** A single-event iCalendar file for the invitation. Times are written in UTC. */
export function buildIcs(content: InvitationContent, { uid, title, stamp, url }: IcsOptions): string {
  const start = eventInstant(content.startsAt);
  const location = [content.venue.name, content.venue.address.replace(/\n/g, ", "), content.venue.city].join(", ");
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Brindo//Invitation//KA",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${utc(stamp)}`,
    `DTSTART:${utc(start)}`,
    `DTEND:${utc(start + DEFAULT_DURATION_MS)}`,
    `SUMMARY:${escapeText(title)}`,
    `LOCATION:${escapeText(location)}`,
    ...(url ? [`URL:${url}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}
