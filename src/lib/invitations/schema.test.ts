import { describe, expect, it } from "vitest";
import { copy } from "@content/copy.ka";
import { checkComplete, invitationContentSchema, invitationDraftSchema, LIMITS, nameParts } from "./schema";

// A mutable copy of the full sample, loosely typed so tests can put bad values in it.
type Draft = {
  partners: string[];
  startsAt: string;
  venue: { name: string; address: string; city: string; mapQuery?: string };
  message?: string;
  photo?: { url: string; blurDataUrl?: string };
  program?: { time: string; label: string }[];
  rsvpDeadline: string;
  dressCode?: string;
};
const valid = () => structuredClone(copy.samples.full) as unknown as Draft;
const parse = (c: unknown) => invitationContentSchema.safeParse(c);

describe("invitationContentSchema", () => {
  it("accepts both samples", () => {
    expect(parse(copy.samples.full).success).toBe(true);
    expect(parse(copy.samples.short).success).toBe(true);
  });

  it("defaults a missing program to an empty list", () => {
    const out = invitationContentSchema.parse(copy.samples.short);
    expect(out.program).toEqual([]);
    expect(out.photo).toBeUndefined();
  });

  it("cleans text: trims, collapses spaces, strips control and bidi characters", () => {
    const c = valid();
    c.venue.name = "  ორბელიანების ‮  სასახლე\u0007 ";
    c.message = "პირველი\r\n\r\n\r\n\r\nმეორე  ხაზი ​";
    const out = invitationContentSchema.parse(c);
    expect(out.venue.name).toBe("ორბელიანების სასახლე");
    expect(out.message).toBe("პირველი\n\nმეორე ხაზი");
  });

  it("maps Mtavruli capitals in names to Mkhedruli", () => {
    const c = valid();
    c.partners = ["ᲜᲘᲜᲝ", "გიორგი"];
    expect(invitationContentSchema.parse(c).partners[0]).toBe("ნინო");
  });

  it("rejects names with characters the display font lacks", () => {
    for (const bad of ["ნინო😀", "Nino №1", "<b>ნინო</b>", "ⴌⴈⴌⴍ", "-ნინო"]) {
      const c = valid();
      c.partners = [bad, "გიორგი"];
      expect(parse(c).success, bad).toBe(false);
    }
  });

  it("accepts hyphenated, apostrophe and Latin names", () => {
    for (const ok of ["ციციშვილი-ბაგრატიონი", "O'Brien", "José María", "ნ. ბერიძე"]) {
      const c = valid();
      c.partners = [ok, "გიორგი"];
      expect(parse(c).success, ok).toBe(true);
    }
  });

  it("enforces length limits", () => {
    const tooLong = (n: number) => "ა".repeat(n + 1);
    const cases: [string, (c: Draft) => void][] = [
      ["name", (c) => (c.partners = ["ა ".repeat(LIMITS.name).trim(), "ბ"])],
      ["name part", (c) => (c.partners = [tooLong(LIMITS.namePart), "ბ"])],
      ["message", (c) => (c.message = tooLong(LIMITS.message))],
      ["message lines", (c) => (c.message = Array(LIMITS.messageLines + 1).fill("ა").join("\n"))],
      ["venue name", (c) => (c.venue.name = tooLong(LIMITS.venueName))],
      ["address", (c) => (c.venue.address = tooLong(LIMITS.address))],
      ["program items", (c) => (c.program = Array(LIMITS.programItems + 1).fill({ time: "18:00", label: "ა" }))],
      ["program label", (c) => (c.program = [{ time: "18:00", label: tooLong(LIMITS.programLabel) }])],
      ["dress code", (c) => (c.dressCode = tooLong(LIMITS.dressCode))],
    ];
    for (const [name, mutate] of cases) {
      const c = valid();
      mutate(c);
      expect(parse(c).success, name).toBe(false);
    }
  });

  it("rejects empty required text", () => {
    const c = valid();
    c.venue.name = "   ";
    expect(parse(c).success).toBe(false);
  });

  it("validates dates and times", () => {
    for (const startsAt of ["2027-02-30T18:00", "2027-06-12T24:00", "2027-06-12 18:00", "2027-06-12T18:00+04:00", "2027-06-12"]) {
      const c = valid();
      c.startsAt = startsAt;
      expect(parse(c).success, startsAt).toBe(false);
    }
    const c = valid();
    c.program = [{ time: "9:00", label: "ა" }];
    expect(parse(c).success).toBe(false);
  });

  it("requires the RSVP deadline on or before the event day", () => {
    const c = valid();
    c.rsvpDeadline = "2027-06-13";
    expect(parse(c).success).toBe(false);
    c.rsvpDeadline = "2027-06-12";
    expect(parse(c).success).toBe(true);
  });

  it("only accepts https or site-relative photo URLs and small image data URLs", () => {
    for (const url of ["http://example.com/a.jpg", "javascript:alert(1)", "//evil.com/a.jpg", "data:image/png;base64,AAAA"]) {
      const c = valid();
      c.photo = { url };
      expect(parse(c).success, url).toBe(false);
    }
    const c = valid();
    c.photo = { url: "https://x.supabase.co/storage/v1/object/public/photos/a.webp", blurDataUrl: "data:text/html;base64,AAAA" };
    expect(parse(c).success).toBe(false);
    c.photo = { url: "https://x.supabase.co/storage/v1/object/public/photos/a.webp" };
    expect(parse(c).success).toBe(true);
  });

  it("drops unknown keys", () => {
    const out = invitationContentSchema.parse({ ...valid(), price: 0, status: "published" });
    expect(out).not.toHaveProperty("price");
    expect(out).not.toHaveProperty("status");
  });
});

describe("nameParts", () => {
  it("splits on spaces and after hyphens", () => {
    expect(nameParts("ელისაბედ ციციშვილი-ბაგრატიონი")).toEqual(["ელისაბედ", "ციციშვილი-", "ბაგრატიონი"]);
    expect(nameParts("ია")).toEqual(["ია"]);
  });
});

describe("invitationDraftSchema and checkComplete", () => {
  it("accepts an empty draft and drops blank text", () => {
    const out = invitationDraftSchema.parse({
      partners: ["ნინო", "  "],
      venue: { name: "", address: " ", city: "" },
      message: "",
      program: [{ time: "18:00", label: "" }],
    });
    expect(out.partners).toEqual(["ნინო", undefined]);
    expect(out.venue).toEqual({});
    expect(out.message).toBeUndefined();
    expect(out.program).toEqual([{ time: "18:00" }]);
  });

  it("still enforces formats and limits on what is filled in", () => {
    expect(invitationDraftSchema.safeParse({ partners: ["ნინო😀", ""] }).success).toBe(false);
    expect(invitationDraftSchema.safeParse({ message: "ა".repeat(LIMITS.message + 1) }).success).toBe(false);
    expect(invitationDraftSchema.safeParse({ startsAt: "2027-02-30T18:00" }).success).toBe(false);
  });

  it("reports missing required fields for a half-filled draft", () => {
    const result = checkComplete({ partners: ["ნინო", "გიორგი"], message: "" });
    expect(result.success).toBe(false);
    const paths = result.error!.issues.map((i) => i.path.join("."));
    expect(paths).toEqual(expect.arrayContaining(["startsAt", "venue", "rsvpDeadline"]));
    expect(paths).not.toContain("message");
  });

  it("accepts a complete draft with blank optional fields", () => {
    expect(checkComplete({ ...copy.samples.short, message: "", dressCode: " " }).success).toBe(true);
  });

  it("accepts a photo focal point inside 0–100", () => {
    const c = valid();
    c.photo = { url: "/preview/lumiere-sample.jpg", focus: { x: 30, y: 70 } } as Draft["photo"];
    expect(parse(c).success).toBe(true);
    c.photo = { url: "/preview/lumiere-sample.jpg", focus: { x: 130, y: 70 } } as Draft["photo"];
    expect(parse(c).success).toBe(false);
  });
});
