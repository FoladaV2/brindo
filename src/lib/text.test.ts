import { describe, expect, it } from "vitest";
import { fill, isLatinOnly } from "./text";

describe("isLatinOnly", () => {
  it("accepts Latin text with common punctuation", () => {
    expect(isLatinOnly("Brindo design system · light surface")).toBe(true);
    expect(isLatinOnly("Save — 49 GEL")).toBe(true);
  });

  it("rejects any Georgian, so it is never uppercased", () => {
    expect(isLatinOnly("თარიღი")).toBe(false);
    expect(isLatinOnly("Date · თარიღი")).toBe(false);
  });
});

describe("fill", () => {
  it("fills placeholders and leaves unknown ones", () => {
    expect(fill("მოსაწვევი {n} სტუმარზეა", { n: 3 })).toBe("მოსაწვევი 3 სტუმარზეა");
    expect(fill("{a} {b}", { a: "x" })).toBe("x {b}");
  });
});
