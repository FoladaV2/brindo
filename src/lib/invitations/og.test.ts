import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { copy } from "@content/copy.ka";
import { renderOgImage } from "./og";
import { invitationContentSchema } from "./schema";

// Set OG_OUT=<folder> to write the images for a visual check.
const out = process.env.OG_OUT;

const cases = {
  full: copy.samples.full,
  short: copy.samples.short,
  longest: { ...copy.samples.full, partners: ["ალექსანდრე ქართველიშვილი-ბაგრატიონი", "ელისაბედ ციციშვილი-ჯავახიშვილი"] },
  latin: { ...copy.samples.short, partners: ["José María", "O'Brien"] },
};

const runs = (["light", "dark"] as const).flatMap((surface) =>
  Object.entries(cases).map(([name, raw]) => [`${name}-${surface}`, raw, surface] as const),
);

describe("renderOgImage", () => {
  it.each(runs)("renders a 1200×630 PNG for %s", async (name, raw, surface) => {
    const res = await renderOgImage(invitationContentSchema.parse(raw), surface);
    expect(res.headers.get("content-type")).toBe("image/png");
    const png = Buffer.from(await res.arrayBuffer());
    expect(png.subarray(1, 4).toString()).toBe("PNG");
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    if (out) writeFileSync(join(out, `og-${name}.png`), png);
  }, 30_000);
});
