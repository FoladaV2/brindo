// Checks every text/background token pair against WCAG AA. Exits 1 if any pair fails.
// Usage: npm run check:contrast
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contrast, parseBlocks, resolver } from "./contrast.mjs";

const TEXT = 4.5; // body text
const LARGE = 3; // large text (24px+, or 18.66px+ bold)
const UI = 3; // non-text: control boundaries, focus rings (WCAG 1.4.11)

// Brand (src/styles/brand.css): [foreground, background, minimum, what it is used for, only on surface]
const BRAND_PAIRS = [
  ["--foreground", "--background", TEXT, "body text"],
  ["--foreground", "--card", TEXT, "text on cards and inputs"],
  ["--foreground", "--secondary", TEXT, "text on secondary surfaces"],
  ["--muted-foreground", "--background", TEXT, "secondary text"],
  ["--muted-foreground", "--card", TEXT, "secondary text on cards"],
  ["--muted-foreground", "--secondary", TEXT, "secondary text on secondary surfaces"],
  ["--primary-foreground", "--primary", TEXT, "primary button label"],
  ["--primary-foreground", "--primary-hover", TEXT, "primary button label, hovered"],
  ["--primary", "--background", TEXT, "links, eyebrows", "light"],
  ["--primary", "--card", TEXT, "links on cards", "light"],
  ["--primary", "--selected", TEXT, "badge and selected choice text", "light"],
  ["--foreground", "--selected", TEXT, "text on a selected choice", "light"],
  ["--destructive", "--background", TEXT, "form error message", "light"],
  ["--destructive", "--card", TEXT, "form error on cards", "light"],
  ["--input", "--background", UI, "input border"],
  ["--input", "--card", UI, "input border against its fill", "light"],
  ["--ring", "--background", UI, "focus ring"],
];

// Templates (src/styles/template-tokens.css)
const TEMPLATE_PAIRS = [
  ["--fg", "--bg", TEXT, "body text"],
  ["--fg", "--raised", TEXT, "body text on raised surface"],
  ["--fg-muted", "--bg", TEXT, "secondary text"],
  ["--fg-muted", "--raised", TEXT, "secondary text on raised surface"],
  ["--gilt-fg", "--bg", TEXT, "small accent text, labels"],
  ["--gilt-fg", "--raised", TEXT, "small accent text on raised surface"],
  ["--error", "--bg", TEXT, "form error message"],
  ["--error", "--raised", TEXT, "form error on raised surface"],
  ["--btn-fg", "--btn-bg", TEXT, "primary button label"],
  ["--choice-on-fg", "--choice-on-bg", TEXT, "selected RSVP choice"],
  ["--choice-on-muted", "--choice-on-bg", TEXT, "selected RSVP choice hint"],
  ["--gilt", "--bg", LARGE, "large display type in accent", "dark"],
  ["--gilt", "--raised", LARGE, "large display type in accent on raised", "dark"],
  ["--control-line", "--bg", UI, "input resting underline"],
  ["--control-line", "--raised", UI, "input underline on raised surface"],
  ["--focus", "--bg", UI, "focus ring"],
  ["--focus", "--raised", UI, "focus ring on raised surface"],
  ["--error", "--bg", UI, "error underline"],
];

const SOURCES = [
  { file: "brand.css", pairs: BRAND_PAIRS, surfaces: { light: ":root", inverted: ".inverted" } },
  {
    file: "template-tokens.css",
    pairs: TEMPLATE_PAIRS,
    surfaces: { light: '[data-surface="light"]', dark: '[data-surface="dark"]' },
  },
];

let failures = 0;
const rows = [];
for (const { file, pairs, surfaces } of SOURCES) {
  const css = readFileSync(fileURLToPath(new URL(`../src/styles/${file}`, import.meta.url)), "utf8");
  const blocks = parseBlocks(css);
  for (const [surface, selector] of Object.entries(surfaces)) {
    const resolve = resolver(blocks, selector);
    for (const [fg, bg, min, use, only] of pairs) {
      if (only && only !== surface) continue;
      const ratio = contrast(resolve(fg), resolve(bg));
      const ok = ratio >= min;
      if (!ok) failures++;
      rows.push({ file, surface, pair: `${fg} on ${bg}`, ratio: ratio.toFixed(2), min, result: ok ? "pass" : "FAIL", use });
    }
  }
}

console.table(rows);
if (failures) {
  console.error(`\n${failures} pair(s) below WCAG AA.`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} pairs meet WCAG AA.`);
