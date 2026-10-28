import { describe, expect, it } from "vitest";
import { clientIp, windowStart } from "@/lib/rate-limit";
import { rateLimitKey, RSVP_RATE_LIMIT, rsvpRequestSchema } from "./rsvp";

const token = "x".repeat(32);

describe("rsvpRequestSchema", () => {
  it("accepts a well-formed answer", () => {
    expect(rsvpRequestSchema.safeParse({ slug: "ana-da-luka-m3pd", token, attending: true, partySize: 2 }).success).toBe(true);
  });

  it.each([
    ["a bad slug", { slug: "../etc", token, attending: true, partySize: 1 }],
    ["a short token", { slug: "ana-da-luka", token: "abc", attending: true, partySize: 1 }],
    ["a party over six", { slug: "ana-da-luka", token, attending: true, partySize: 7 }],
    ["a fractional party", { slug: "ana-da-luka", token, attending: true, partySize: 1.5 }],
    ["a string for attending", { slug: "ana-da-luka", token, attending: "yes", partySize: 1 }],
  ])("rejects %s", (_label, body) => {
    expect(rsvpRequestSchema.safeParse(body).success).toBe(false);
  });

  it("drops client-sent ids", () => {
    const parsed = rsvpRequestSchema.parse({ slug: "ana-da-luka", token, attending: false, partySize: 0, guestId: "x", invitationId: "y" });
    expect(Object.keys(parsed).sort()).toEqual(["attending", "partySize", "slug", "token"]);
  });
});

describe("rate limiting", () => {
  it("keys by a hash of IP and token, storing neither", () => {
    const key = rateLimitKey("203.0.113.9", token);
    expect(key).toMatch(/^rsvp:[0-9a-f]{64}$/);
    expect(key).not.toContain("203.0.113.9");
    expect(key).not.toContain(token);
    expect(rateLimitKey("203.0.113.10", token)).not.toBe(key);
  });

  it("uses fixed 10-minute windows", () => {
    const t = Date.parse("2027-05-01T10:07:30Z");
    expect(new Date(windowStart(t, RSVP_RATE_LIMIT.windowMs)).toISOString()).toBe("2027-05-01T10:00:00.000Z");
  });

  it("reads the client IP from the platform headers", () => {
    expect(clientIp(new Headers({ "x-forwarded-for": "198.51.100.1, 10.0.0.1" }))).toBe("198.51.100.1");
    expect(clientIp(new Headers({ "x-real-ip": "198.51.100.2", "x-forwarded-for": "1.1.1.1" }))).toBe("198.51.100.2");
    expect(clientIp(new Headers())).toBe("unknown");
  });
});
