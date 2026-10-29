import { z } from "zod";
import { slugSchema } from "@/lib/invitations/slug-format";

/** Guest answers through the one invitation link (SPEC.md "Open RSVP"). Shared by server and form. */
export const RESPONSE_LIMITS = {
  firstName: 40,
  lastName: 60,
  /** The most people one reply may bring; each invitation sets its own cap up to this. */
  partySize: 10,
  /** Answers one invitation accepts in total. */
  perInvitation: 1000,
} as const;

// Control characters, zero-width and bidi controls.
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁯﻿]/g;

/** Letters of any script, with spaces, hyphens, apostrophes and dots between them. */
const PERSON_NAME = /^[\p{L}\p{M}]+(?:[ '’.-]+[\p{L}\p{M}]+)*\.?$/u;

const personName = (max: number) =>
  z
    .string()
    .transform((s) => s.normalize("NFC").replace(INVISIBLE, "").replace(/\s+/g, " ").trim())
    .pipe(z.string().min(1).max(max).regex(PERSON_NAME));

export const firstNameSchema = personName(RESPONSE_LIMITS.firstName);
export const lastNameSchema = personName(RESPONSE_LIMITS.lastName);

/** The edit token the browser keeps: 24 random bytes, base64url (32 characters). */
export const editTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{32}$/);

export const rsvpRequestSchema = z.object({
  slug: slugSchema,
  firstName: firstNameSchema,
  lastName: lastNameSchema,
  attending: z.boolean(),
  /** People coming, the guest included. Ignored for "not coming". */
  partySize: z.number().int().min(1).max(RESPONSE_LIMITS.partySize).nullable(),
  editToken: editTokenSchema.optional(),
});

export type RsvpRequest = z.output<typeof rsvpRequestSchema>;
