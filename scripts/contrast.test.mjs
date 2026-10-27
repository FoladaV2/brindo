import { describe, expect, it } from "vitest";
import { contrast, parseBlocks, resolver } from "./contrast.mjs";

describe("contrast", () => {
  it("matches known WCAG ratios", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrast("#ffffff", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrast("#767676", "#ffffff")).toBeCloseTo(4.54, 2);
  });

  it("composites translucent colors over the background", () => {
    expect(contrast("rgb(0 0 0 / 0)", "#ffffff")).toBeCloseTo(1, 5);
    expect(contrast("rgb(0 0 0 / 0.5)", "#ffffff")).toBeGreaterThan(3.5);
  });
});

describe("token resolver", () => {
  const css = `:root { --a: #111111; --b: var(--a); }
    [data-surface="dark"] { --b: #eeeeee; }`;

  it("follows var() references and lets a surface override :root", () => {
    const blocks = parseBlocks(css);
    expect(resolver(blocks, '[data-surface="light"]')("--b")).toBe("#111111");
    expect(resolver(blocks, '[data-surface="dark"]')("--b")).toBe("#eeeeee");
  });
});
