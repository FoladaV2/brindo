import { describe, expect, it } from "vitest";
import { randomSuffix, slugFromNames, transliterate } from "./slug";

// Same rule as the invitations_slug_format database constraint.
const SLUG_FORMAT = /^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/;

describe("transliterate", () => {
  it("romanizes Georgian", () => {
    expect(transliterate("ნინო")).toBe("nino");
    expect(transliterate("გიორგი")).toBe("giorgi");
    expect(transliterate("ჯავახიშვილი")).toBe("javakhishvili");
    expect(transliterate("წყალტუბო")).toBe("tsqaltubo");
  });

  it("strips accents and punctuation", () => {
    expect(transliterate("José María")).toBe("jose-maria");
    expect(transliterate("O'Brien")).toBe("o-brien");
  });
});

describe("slugFromNames", () => {
  it("joins the given names with a random suffix", () => {
    expect(slugFromNames(["ნინო", "გიორგი"], "k7xq")).toBe("nino-da-giorgi-k7xq");
    expect(slugFromNames(["ალექსანდრე ჯავახიშვილი", "ელისაბედ ციციშვილი-ბაგრატიონი"], "ab23")).toBe(
      "aleksandre-da-elisabed-ab23",
    );
  });

  it("always fits the database slug format", () => {
    const cases: [string, string][] = [
      ["ია", "ლუკა"],
      ["ა", "ბ"],
      ["ალექსანდრეალექსანდრეალექსანდრე", "ელისაბედელისაბედელისაბედ"],
      ["", ""],
      ["ნინო", ""],
    ];
    for (const names of cases) expect(slugFromNames(names)).toMatch(SLUG_FORMAT);
  });

  it("uses an unambiguous random suffix", () => {
    const suffixes = new Set(Array.from({ length: 200 }, () => randomSuffix()));
    expect(suffixes.size).toBeGreaterThan(190);
    for (const s of suffixes) expect(s).toMatch(/^[a-km-np-z2-9]{4}$/);
  });
});

describe("slugFromTitle", () => {
  it("romanizes the title and adds the random suffix", async () => {
    const { slugFromTitle } = await import("./slug");
    expect(slugFromTitle("ანას 30", "k7xq")).toBe("anas-30-k7xq");
    expect(slugFromTitle("TBC-ის საახალწლო ვახშამი", "k7xq")).toBe("tbc-is-saakhaltslo-vakhshami-k7xq");
  });

  it("stays within the slug rules for long titles", async () => {
    const { slugFromTitle } = await import("./slug");
    const slug = slugFromTitle("ძალიან ძალიან ძალიან გრძელი ღონისძიების სათაური", "k7xq");
    expect(slug).toMatch(/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/);
  });
});
