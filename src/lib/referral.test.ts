import { describe, expect, it } from "vitest";
import { parseRefCode } from "./referral";

describe("parseRefCode", () => {
  it("keeps short codes of letters, digits, dash and underscore", () => {
    expect(parseRefCode("ANA2026")).toBe("ANA2026");
    expect(parseRefCode("salon_tbilisi-1")).toBe("salon_tbilisi-1");
    expect(parseRefCode("a".repeat(32))).toBe("a".repeat(32));
  });

  it("drops anything else", () => {
    for (const bad of [null, undefined, "", "a".repeat(33), "ანა", "a b", "a;b", "<script>", "a%20b"]) {
      expect(parseRefCode(bad)).toBeNull();
    }
  });
});
