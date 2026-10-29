import { describe, expect, it } from "vitest";
import { clientIp, windowStart } from "@/lib/rate-limit";
import { hashEditToken, newEditToken, rateLimitKey, RSVP_RATE_LIMIT } from "./rsvp";
import { editTokenSchema, rsvpRequestSchema } from "./schema";

const base = { slug: "anas-30-m3pd", firstName: "ნინო", lastName: "ბერიძე", attending: true, partySize: 4 };

describe("rsvpRequestSchema", () => {
  it("accepts a well-formed answer, with or without an edit token", () => {
    expect(rsvpRequestSchema.safeParse(base).success).toBe(true);
    expect(rsvpRequestSchema.safeParse({ ...base, editToken: newEditToken() }).success).toBe(true);
    expect(rsvpRequestSchema.safeParse({ ...base, attending: false, partySize: null }).success).toBe(true);
  });

  it("cleans names: trims, collapses spaces, keeps hyphens and apostrophes", () => {
    const parsed = rsvpRequestSchema.parse({ ...base, firstName: "  ანა  მარია ", lastName: "ბერიძე-ჩიქოვანი" });
    expect(parsed.firstName).toBe("ანა მარია");
    expect(parsed.lastName).toBe("ბერიძე-ჩიქოვანი");
    expect(rsvpRequestSchema.parse({ ...base, lastName: "O’Brien" }).lastName).toBe("O’Brien");
  });

  it.each([
    ["a bad slug", { ...base, slug: "../etc" }],
    ["an empty first name", { ...base, firstName: "  " }],
    ["a missing surname", { ...base, lastName: undefined }],
    ["digits in a name", { ...base, firstName: "ნინო2" }],
    ["markup in a name", { ...base, lastName: "<b>x</b>" }],
    ["a first name over 40 letters", { ...base, firstName: "ა".repeat(41) }],
    ["a party of eleven", { ...base, partySize: 11 }],
    ["a party of zero", { ...base, partySize: 0 }],
    ["a fractional party", { ...base, partySize: 1.5 }],
    ["a string for attending", { ...base, attending: "yes" }],
    ["a short edit token", { ...base, editToken: "abc" }],
  ])("rejects %s", (_label, body) => {
    expect(rsvpRequestSchema.safeParse(body).success).toBe(false);
  });

  it("drops client-sent ids", () => {
    const parsed = rsvpRequestSchema.parse({ ...base, invitationId: "x", responseId: "y", id: "z" });
    expect(Object.keys(parsed).sort()).toEqual(["attending", "firstName", "lastName", "partySize", "slug"]);
  });
});

describe("edit tokens", () => {
  it("are 24 random bytes in base64url, different every time", () => {
    const a = newEditToken();
    expect(editTokenSchema.safeParse(a).success).toBe(true);
    expect(Buffer.from(a, "base64url")).toHaveLength(24);
    expect(newEditToken()).not.toBe(a);
  });

  it("are stored only as a SHA-256 hash", () => {
    const token = newEditToken();
    expect(hashEditToken(token)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashEditToken(token)).not.toContain(token);
    expect(hashEditToken(token)).toBe(hashEditToken(token));
  });
});

describe("rate limiting", () => {
  it("keys by a hash of IP and slug, storing neither", () => {
    const key = rateLimitKey("203.0.113.9", base.slug);
    expect(key).toMatch(/^rsvp:[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.9");
    expect(rateLimitKey("203.0.113.10", base.slug)).not.toBe(key);
    expect(rateLimitKey("203.0.113.9", "other-slug")).not.toBe(key);
  });

  it("allows a group chat's worth of answers from one address", () => {
    expect(RSVP_RATE_LIMIT.requests).toBeGreaterThanOrEqual(30);
    const t = Date.parse("2027-05-01T10:07:30Z");
    expect(new Date(windowStart(t, RSVP_RATE_LIMIT.windowMs)).toISOString()).toBe("2027-05-01T10:00:00.000Z");
  });

  it("reads the client IP from the platform headers", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
