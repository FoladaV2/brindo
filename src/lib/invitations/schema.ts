import { z } from "zod";

/**
 * Structured content of one invitation: what the couple types in the editor and what every
 * template renders. Stored as `invitations.content` (jsonb). Parse it on write and on read.
 */

/** Every event happens in Georgia. Dates and times in content are wall-clock times there. */
export const EVENT_TIME_ZONE = "Asia/Tbilisi";

export const LIMITS = {
  name: 40,
  namePart: 18,
  title: 40,
  venueName: 80,
  address: 200,
  city: 40,
  addressLines: 4,
  mapQuery: 200,
  message: 400,
  messageLines: 10,
  programItems: 8,
  programLabel: 60,
  dressCode: 60,
} as const;

// Mtavruli capitals (U+1C90–1CBF) map one-to-one onto Mkhedruli (U+10D0–10FF). The display font
// lacks most Mtavruli, and in an all-caps font the two look the same, so names are stored in Mkhedruli.
const MTAVRULI_OFFSET = 0x1c90 - 0x10d0;
const toMkhedruli = (s: string) =>
  s.replace(/[Ა-Ჿ]/g, (c) => String.fromCharCode(c.charCodeAt(0) - MTAVRULI_OFFSET));

/** Letters the display font has: Latin, Latin-1 letters, the 33 modern Georgian letters. */
const NAME_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿა-ჰ]+(?:[ '’.-]+[A-Za-zÀ-ÖØ-öø-ÿა-ჰ]+)*\.?$/;

/** Letters the display font has, digits, and the punctuation a title needs ("ანას 30!", "TBC & Co."). */
const TITLE_PATTERN = /^[A-Za-zÀ-ÖØ-öø-ÿა-ჰ0-9]+(?:[ '’.,!&-]+[A-Za-zÀ-ÖØ-öø-ÿა-ჰ0-9]+)*[.!]?$/;

/** Splits a name where the hero may break a line: spaces, and after hyphens. */
export function nameParts(name: string): string[] {
  return name.split(" ").flatMap((word) => word.split(/(?<=-)/));
}

// Control characters other than newline, plus zero-width and bidi controls.
const INVISIBLE = /[\u0000-\u0009\u000B-\u001F\u007F-\u009F​-‏‪-‮⁠-⁯﻿]/g;

function clean(s: string, multiline: boolean) {
  let out = s.normalize("NFC").replace(/\r\n?/g, "\n").replace(INVISIBLE, "");
  if (!multiline) out = out.replace(/\n/g, " ");
  return out
    .split("\n")
    .map((line) => line.replace(/[ \t ]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const countLines = (s: string) => s.split("\n").length;

/** Trimmed, single-line text without control characters, 1..max characters. */
const line = (max: number) => z.string().transform((s) => clean(s, false)).pipe(z.string().min(1).max(max));

/** Trimmed text that keeps line breaks (at most one blank line in a row), 1..max characters. */
const paragraph = (max: number, maxLines: number) =>
  z
    .string()
    .transform((s) => clean(s, true))
    .pipe(z.string().min(1).max(max).refine((s) => countLines(s) <= maxLines, { message: `At most ${maxLines} lines` }));

export const partnerName = z
  .string()
  .transform((s) => toMkhedruli(clean(s, false)))
  .pipe(
    z
      .string()
      .min(1)
      .max(LIMITS.name)
      .regex(NAME_PATTERN, { message: "Letters, spaces, hyphens and apostrophes only" })
      .refine((s) => nameParts(s).every((p) => p.length <= LIMITS.namePart), {
        message: `Each word at most ${LIMITS.namePart} letters`,
      }),
  );

/** One title for events that are not a couple's: "ანას 30", "TBC-ის საახალწლო ვახშამი". */
export const eventTitle = z
  .string()
  .transform((s) => toMkhedruli(clean(s, false)))
  .pipe(
    z
      .string()
      .min(1)
      .max(LIMITS.title)
      .regex(TITLE_PATTERN, { message: "Letters, digits and simple punctuation only" })
      .refine((s) => nameParts(s).every((p) => p.length <= LIMITS.namePart), {
        message: `Each word at most ${LIMITS.namePart} letters`,
      }),
  );

const isRealDate = (y: number, m: number, d: number) => {
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
};

/** Calendar date, YYYY-MM-DD. */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((s) => isRealDate(+s.slice(0, 4), +s.slice(5, 7), +s.slice(8, 10)), { message: "Not a real date" });

/** 24-hour wall-clock time, HH:MM. */
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

/** Local date and time in Tbilisi, YYYY-MM-DDTHH:MM, no offset. */
const localDateTime = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T([01]\d|2[0-3]):[0-5]\d$/)
  .refine((s) => isoDate.safeParse(s.slice(0, 10)).success, { message: "Not a real date" });

/**
 * Site-relative path (sample content, our own assets) or an https URL (uploaded photos). Plain http
 * only for a local Supabase stack. Server code also checks that uploads sit in the owner's folder.
 */
const imageUrl = z.union([
  z.string().regex(/^\/(?!\/)[\w\-./]{1,200}$/),
  z
    .url({ protocol: /^https?$/ })
    .max(500)
    .refine((u) => u.startsWith("https:") || /^http:\/\/(127\.0\.0\.1|localhost)[:/]/.test(u), {
      message: "https only",
    }),
]);

/** Tiny (about 10px) image as a data URL, shown blurred while the photo loads. */
const blurDataUrl = z
  .string()
  .max(2000)
  .regex(/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/]+={0,2}$/);

/** The point of the photo that stays in frame on any crop, in percent from the top left. */
const focus = z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) });

const photo = z.object({ url: imageUrl, blurDataUrl: blurDataUrl.optional(), focus: focus.optional() });

export const invitationContentSchema = z
  .object({
    /** Wedding and engagement: the two names, shown with an ampersand. */
    partners: z.tuple([partnerName, partnerName]).optional(),
    /** Every other event: one title. */
    title: eventTitle.optional(),
    startsAt: localDateTime,
    venue: z.object({
      name: line(LIMITS.venueName),
      address: paragraph(LIMITS.address, LIMITS.addressLines),
      city: line(LIMITS.city),
      /** What the map buttons search for. Defaults to the venue name, address and city. */
      mapQuery: line(LIMITS.mapQuery).optional(),
    }),
    message: paragraph(LIMITS.message, LIMITS.messageLines).optional(),
    photo: photo.optional(),
    program: z
      .array(z.object({ time, label: line(LIMITS.programLabel) }))
      .max(LIMITS.programItems)
      .default([]),
    rsvpDeadline: isoDate,
    dressCode: line(LIMITS.dressCode).optional(),
  })
  .refine((c) => c.rsvpDeadline <= c.startsAt.slice(0, 10), {
    message: "RSVP deadline must be on or before the event date",
    path: ["rsvpDeadline"],
  })
  .refine((c) => (c.partners ? 1 : 0) + (c.title ? 1 : 0) === 1, {
    message: "Either the two names or a title",
    path: ["title"],
  });

/** Content as the editor submits it (before cleaning). */
export type InvitationContentInput = z.input<typeof invitationContentSchema>;
/** Clean, validated content: what templates receive. */
export type InvitationContent = z.output<typeof invitationContentSchema>;

// Drafts: the same fields and rules, but any field may still be empty. Blank text counts as missing,
// so the editor can autosave a half-filled invitation without storing empty strings.
const blank = (v: unknown) => (v === null || (typeof v === "string" && v.trim() === "") ? undefined : v);
const maybe = <T extends z.ZodType>(schema: T) => z.preprocess(blank, schema.optional());

export const invitationDraftSchema = z.object({
  partners: z.tuple([maybe(partnerName), maybe(partnerName)]).optional(),
  title: maybe(eventTitle),
  startsAt: maybe(localDateTime),
  venue: z
    .object({
      name: maybe(line(LIMITS.venueName)),
      address: maybe(paragraph(LIMITS.address, LIMITS.addressLines)),
      city: maybe(line(LIMITS.city)),
      mapQuery: maybe(line(LIMITS.mapQuery)),
    })
    .optional(),
  message: maybe(paragraph(LIMITS.message, LIMITS.messageLines)),
  photo: photo.optional(),
  program: z
    .array(z.object({ time: maybe(time), label: maybe(line(LIMITS.programLabel)) }))
    .max(LIMITS.programItems)
    .optional(),
  rsvpDeadline: maybe(isoDate),
  dressCode: maybe(line(LIMITS.dressCode)),
});

export type InvitationDraftInput = z.input<typeof invitationDraftSchema>;
export type InvitationDraft = z.output<typeof invitationDraftSchema>;

/**
 * Checks a draft against the full rules (what publishing and the public page require).
 * Runs the draft schema first, so blank optional fields don't count as invalid.
 */
export function checkComplete(input: unknown) {
  const draft = invitationDraftSchema.safeParse(input);
  if (!draft.success) return draft;
  return invitationContentSchema.safeParse(draft.data);
}

// Titles ------------------------------------------------------------------------------

/** What the invitation is called, as one line: "ნინო & გიორგი" or "ანას 30". */
export function displayTitle(content: Pick<InvitationContent, "partners" | "title">, ampersand: string): string {
  if (content.partners) return `${content.partners[0]} ${ampersand} ${content.partners[1]}`;
  return content.title ?? "";
}

/** The title of a draft that may still be half filled: what the host typed so far, or "". */
export function draftTitle(draft: InvitationDraft, ampersand: string): string {
  const [a, b] = draft.partners ?? [];
  if (a || b) return [a, b].filter(Boolean).join(` ${ampersand} `);
  return draft.title ?? "";
}

/** The words the hero sets large, each a candidate line; the widest one decides the type size. */
export function titleWords(content: Pick<InvitationContent, "partners" | "title">): string[] {
  return content.partners ? [...content.partners] : content.title ? [content.title] : [];
}

/** The hero's lines: the two names around an ampersand, or the title broken at spaces and hyphens. */
export function heroLines(content: Pick<InvitationContent, "partners" | "title">): { text: string; ampersand: boolean }[] {
  const words = (text: string) => nameParts(text).map((part) => ({ text: part, ampersand: false }));
  if (content.partners) return [...words(content.partners[0]), { text: "&", ampersand: true }, ...words(content.partners[1])];
  return content.title ? words(content.title) : [];
}
