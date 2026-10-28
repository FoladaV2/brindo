import { describe, expect, it } from "vitest";
import { displayWidthEm, widestNameLineEm } from "./fit";

describe("display fitting", () => {
  it("measures with the font's own advance widths", () => {
    // Georgian letters in the display font are 0.599–1.163em wide: "ია" is narrow, "ჯავახიშვილი" wide.
    expect(displayWidthEm("ია")).toBeLessThan(1.6);
    expect(displayWidthEm("ჯავახიშვილი")).toBeGreaterThan(7);
  });

  it("counts letter-spacing per character", () => {
    expect(displayWidthEm("ნინო", 0.1) - displayWidthEm("ნინო")).toBeCloseTo(0.4);
  });

  it("finds the widest line across both names", () => {
    const parts = ["ალექსანდრე", "ჯავახიშვილი", "ელისაბედ", "ციციშვილი-", "ბაგრატიონი"];
    expect(widestNameLineEm(["ალექსანდრე ჯავახიშვილი", "ელისაბედ ციციშვილი-ბაგრატიონი"])).toBe(
      Math.max(...parts.map((p) => displayWidthEm(p))),
    );
  });
});
