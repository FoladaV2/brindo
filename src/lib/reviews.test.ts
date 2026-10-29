import { describe, expect, it } from "vitest";
import { shownReviews } from "./reviews";

describe("shownReviews", () => {
  it("never shows sample reviews when dev tools are off (production)", () => {
    expect(shownReviews([], false)).toBeNull();
  });

  it("shows samples, marked as samples, in development", () => {
    const shown = shownReviews([], true);
    expect(shown?.sample).toBe(true);
    expect(shown?.reviews.length).toBeGreaterThan(0);
  });

  it("shows real reviews and their average in production", () => {
    const shown = shownReviews(
      [
        { name: "A", event: "ქორწილი", quote: "…", rating: 5 },
        { name: "B", event: "ქორწილი", quote: "…", rating: 4 },
      ],
      false,
    );
    expect(shown).toMatchObject({ sample: false, rating: "4.5" });
  });
});
