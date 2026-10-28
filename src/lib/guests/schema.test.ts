import { describe, expect, it } from "vitest";
import { ADVANCE } from "@/lib/invitations/display-metrics";
import { GUEST_LIMITS, guestInputSchema, guestLink, guestName, guestToken, linksText, splitNameList } from "./schema";

describe("guestName", () => {
  it.each([
    "ნინო ბერიძე-ჩიქოვანი",
    "მარიამ და ლევან კაპანაძეები",
    "ბერიძეების ოჯახი (4)",
    "Anna & Luka O’Brien",
    "გ. ლომიძე",
  ])("accepts %s", (name) => {
    expect(guestName.parse(name)).toBe(name);
  });

  it("collapses spaces, trims, and maps Mtavruli capitals to Mkhedruli", () => {
    expect(guestName.parse("  ნინო \t  ბერიძე  ")).toBe("ნინო ბერიძე");
    expect(guestName.parse("ᲜᲘᲜᲝ")).toBe("ნინო");
  });

  it.each(["", "   ", "-ნინო", "ნინო 🥂", "ნინო​ბერიძე<script>", "x".repeat(GUEST_LIMITS.name + 1)])("rejects %j", (name) => {
    expect(guestName.safeParse(name).success).toBe(false);
  });

  it("accepts only characters the display font has, so no fallback glyphs appear", () => {
    const sample = "ნინო ბერიძე-ჩიქოვანი, Anna & Luka O’Brien (3).";
    expect(guestName.parse(sample)).toBe(sample);
    for (const ch of sample) expect(Object.hasOwn(ADVANCE, ch), ch).toBe(true);
  });

  it("limits party size to 1–6", () => {
    expect(guestInputSchema.safeParse({ name: "ნინო", maxPartySize: 6 }).success).toBe(true);
    for (const n of [0, 7, 2.5]) expect(guestInputSchema.safeParse({ name: "ნინო", maxPartySize: n }).success).toBe(false);
  });
});

describe("splitNameList", () => {
  it("takes one name per line, skipping blanks, bullets and numbering", () => {
    expect(splitNameList("ნინო\r\n\n  - გიორგი \n2. თამარ\n• ლევანი\n   \n")).toEqual(["ნინო", "გიორგი", "თამარ", "ლევანი"]);
  });
});

describe("links", () => {
  const token = "A".repeat(32);

  it("builds /i/[slug]?g=[token]", () => {
    expect(guestLink("https://brindo.ge/", "ana-da-luka-m3pd", token)).toBe(`https://brindo.ge/i/ana-da-luka-m3pd?g=${token}`);
  });

  it("copies all links as 'Name — link', one per line", () => {
    const text = linksText("https://brindo.ge", "s-1a", [
      { name: "ნინო", token },
      { name: "გიორგი", token: "B".repeat(32) },
    ]);
    expect(text).toBe(`ნინო — https://brindo.ge/i/s-1a?g=${token}\nგიორგი — https://brindo.ge/i/s-1a?g=${"B".repeat(32)}`);
  });

  it("accepts only long URL-safe tokens", () => {
    expect(guestToken.safeParse("aB3_-".repeat(7)).success).toBe(true);
    expect(guestToken.safeParse("short").success).toBe(false);
    expect(guestToken.safeParse(`${"a".repeat(31)}=`).success).toBe(false);
  });
});
