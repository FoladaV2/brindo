import { describe, expect, it } from "vitest";
import { copy } from "@content/copy.ka";
import { buildIcs } from "./ics";
import { invitationContentSchema } from "./schema";

const content = invitationContentSchema.parse(copy.samples.full);
const ics = buildIcs(content, {
  uid: "abc@brindo",
  title: "ქორწილი · ალექსანდრე & ელისაბედ",
  stamp: Date.UTC(2026, 9, 28, 10, 0, 0),
  url: "https://brindo.ge/i/abc",
});
const unfolded = ics.replace(/\r\n /g, "");

describe("buildIcs", () => {
  it("is a single VEVENT with CRLF line endings", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VEVENT\r\nEND:VCALENDAR\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    expect(unfolded.match(/BEGIN:VEVENT/g)).toHaveLength(1);
  });

  it("writes times in UTC", () => {
    expect(unfolded).toContain("DTSTART:20270612T130000Z");
    expect(unfolded).toContain("DTEND:20270612T190000Z");
    expect(unfolded).toContain("DTSTAMP:20261028T100000Z");
    expect(unfolded).toContain("UID:abc@brindo");
  });

  it("escapes text values", () => {
    expect(unfolded).toContain("SUMMARY:ქორწილი · ალექსანდრე & ელისაბედ");
    expect(unfolded).toContain("LOCATION:ორბელიანების სასახლე\\, ილია ჭავჭავაძის გამზირი 37ა\\, მეორე სართული");
    expect(unfolded).toMatch(/LOCATION:.*შენობის უკან\\, თბილისი\r\n/);
    const tricky = buildIcs({ ...content, venue: { ...content.venue, name: "a;b\\c" } }, { uid: "x", title: "t", stamp: 0 });
    expect(tricky.replace(/\r\n /g, "")).toContain("LOCATION:a\\;b\\\\c\\,");
  });

  it("folds lines at 75 octets without splitting Georgian characters", () => {
    const encoder = new TextEncoder();
    for (const line of ics.split("\r\n")) expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    // Georgian letters are 3 bytes each; a split one would not survive a strict UTF-8 round trip.
    expect(new TextDecoder("utf-8", { fatal: true }).decode(encoder.encode(ics))).toBe(ics);
    expect(unfolded).toContain("ორბელიანების");
  });
});
