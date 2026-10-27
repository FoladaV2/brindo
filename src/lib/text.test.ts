import { describe, expect, it } from "vitest";
import { isLatinOnly } from "./text";

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
