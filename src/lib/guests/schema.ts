import { z } from "zod";

/**
 * Guests and their personal links. Shared by the editor (client-side checks) and the server, which
 * validates everything again. A guest is only a name and a party-size limit: no contact details.
 */

export const GUEST_LIMITS = {
  name: 60,
  /** People one invitation covers, the guest included. Matches guests_max_party_size_range. */
  partySize: 6,
  /** Names accepted in one bulk paste. */
  bulk: 200,
} as const;

// The guest's name is set in the display font (the RSVP greeting, The Toast), so it may use only
// characters that font has: Latin, Latin-1 letters, modern Georgian, digits and a little punctuation.
const LETTER = "A-Za-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u00FF\u10D0-\u10F0";
const GUEST_NAME = new RegExp(`^[${LETTER}0-9](?:[${LETTER}0-9 '’.,&()-]*[${LETTER}0-9.)])?$`);

const MTAVRULI_OFFSET = 0x1c90 - 0x10d0;
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;

/** One line, NFC, Mtavruli as Mkhedruli, invisible characters removed, spaces collapsed. */
function cleanName(s: string) {
  return s
    .normalize("NFC")
    .replace(INVISIBLE, " ")
    .replace(/[\u1C90-\u1CBF]/g, (c) => String.fromCharCode(c.charCodeAt(0) - MTAVRULI_OFFSET))
    .replace(/\s+/g, " ")
    .trim();
}

export const guestName = z
  .string()
  .transform(cleanName)
  .pipe(z.string().min(1).max(GUEST_LIMITS.name).regex(GUEST_NAME));

export const partySize = z.number().int().min(1).max(GUEST_LIMITS.partySize);

/** A guest as the couple sees it in the editor, personal-link token included. */
export type OwnGuest = { id: string; name: string; maxPartySize: number; token: string };

export const guestInputSchema = z.object({ name: guestName, maxPartySize: partySize });
export type GuestInput = z.input<typeof guestInputSchema>;

/** Lines of a pasted list: one name per line, blank lines skipped. Bullets and numbering are stripped. */
export function splitNameList(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.replace(/^\s*(?:[-•*·]|\d{1,3}[.)])\s+/, "").trim())
    .filter((line) => line.length > 0);
}

/** Same format as guests_token_format: base64url, 24 random bytes or more. */
export const guestToken = z.string().regex(/^[A-Za-z0-9_-]{32,128}$/);

/** A guest's personal link: /i/[slug]?g=[token]. */
export function guestLink(siteUrl: string, slug: string, token: string): string {
  return `${siteUrl.replace(/\/$/, "")}/i/${slug}?g=${token}`;
}

/** "Name — link", one per line, ready to paste into Viber or WhatsApp. */
export function linksText(siteUrl: string, slug: string, guests: { name: string; token: string }[]): string {
  return guests.map((g) => `${g.name} — ${guestLink(siteUrl, slug, g.token)}`).join("\n");
}
