import { describe, expect, it } from "vitest";
import { reminderText, summarize, toOverviewGuest } from "./overview";

const row = (id: string, max: number, rsvp: { attending: boolean; party_size: number } | null) => ({
  id,
  name: `სტუმარი ${id}`,
  max_party_size: max,
  token: `token-${id}`,
  rsvps: rsvp,
});

describe("toOverviewGuest", () => {
  it("reads the status from the RSVP, or its absence", () => {
    expect(toOverviewGuest(row("a", 3, { attending: true, party_size: 2 }))).toMatchObject({ status: "confirmed", partySize: 2, maxPartySize: 3 });
    expect(toOverviewGuest(row("b", 2, { attending: false, party_size: 0 }))).toMatchObject({ status: "declined", partySize: 0 });
    expect(toOverviewGuest(row("c", 4, null))).toMatchObject({ status: "awaiting", partySize: 0 });
  });
});

describe("summarize", () => {
  it("counts guests by status and adds up the confirmed party sizes", () => {
    const guests = [
      row("a", 3, { attending: true, party_size: 3 }),
      row("b", 2, { attending: true, party_size: 1 }),
      row("c", 2, { attending: false, party_size: 0 }),
      row("d", 6, null),
      row("e", 1, null),
    ].map(toOverviewGuest);
    expect(summarize(guests)).toEqual({ invited: 5, confirmed: 2, headcount: 4, declined: 1, awaiting: 2 });
  });

  it("is all zeros without guests", () => {
    expect(summarize([])).toEqual({ invited: 0, confirmed: 0, headcount: 0, declined: 0, awaiting: 0 });
  });
});

describe("reminderText", () => {
  const link = "https://brindo.ge/i/ia-da-luka-x7k2?g=abc";

  it("puts the personal link on its own line after the message", () => {
    expect(reminderText("გამარჯობა!\nგთხოვთ, გვიპასუხოთ:\n\n", link)).toBe(`გამარჯობა!\nგთხოვთ, გვიპასუხოთ:\n${link}`);
  });

  it("is just the link when the message is cleared", () => {
    expect(reminderText("  \n ", link)).toBe(link);
  });
});
