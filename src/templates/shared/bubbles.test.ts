import { describe, expect, it } from "vitest";
import { anyLeft, bubbleAt, createBubbles, MAX_PARTICLES } from "./bubbles";

/** Deterministic random numbers for repeatable tests. */
function seeded(seed = 7) {
  return () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
}

describe("The Toast's bubbles", () => {
  it("never exceed 60 particles", () => {
    expect(createBubbles(500, 288, 352, seeded())).toHaveLength(MAX_PARTICLES);
    expect(createBubbles(40, 288, 352, seeded())).toHaveLength(40);
  });

  it("rise and fade, then stop: the effect never loops", () => {
    const bubbles = createBubbles(40, 288, 352, seeded());
    const end = Math.max(...bubbles.map((b) => b.born + b.life));
    expect(end).toBeLessThan(2200);
    expect(anyLeft(bubbles, end - 1)).toBe(true);
    expect(anyLeft(bubbles, end)).toBe(false);

    const b = bubbles[0];
    const early = bubbleAt(b, b.born + b.life * 0.1)!;
    const late = bubbleAt(b, b.born + b.life * 0.9)!;
    expect(late.y).toBeLessThan(early.y);
    expect(bubbleAt(b, b.born + b.life)).toBeNull();
    expect(bubbleAt(b, b.born - 1)).toBeNull();
  });
});
