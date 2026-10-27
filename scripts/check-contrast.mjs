// Checks every text/background token pair against WCAG AA. Exits 1 if any pair fails.
// Usage: npm run check:contrast
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { contrast, parseBlocks, resolver } from "./contrast.mjs";

const TEXT = 4.5; // body text
const LARGE = 3; // large text (24px+, or 18.66px+ bold)
const UI = 3; // non-text: control boundaries, focus rings (WCAG 1.4.11)

// [foreground, background, minimum, what it is used for]
const PAIRS = [
  ["--fg", "--bg", TEXT, "body text"],
  ["--fg", "--raised", TEXT, "body text on raised surface"],
  ["--fg-muted", "--bg", TEXT, "secondary text"],
  ["--fg-muted", "--raised", TEXT, "secondary text on raised surface"],
  ["--accent-fg", "--bg", TEXT, "small accent text, labels"],
  ["--accent-fg", "--raised", TEXT, "small accent text on raised surface"],
  ["--error", "--bg", TEXT, "form error message"],
  ["--error", "--raised", TEXT, "form error on raised surface"],
  ["--btn-fg", "--btn-bg", TEXT, "primary button label"],
  ["--accent", "--bg", LARGE, "large display type in accent", "dark"],
  ["--accent", "--raised", LARGE, "large display type in accent on raised", "dark"],
  ["--control-line", "--bg", UI, "input resting underline"],
  ["--control-line", "--raised", UI, "input underline on raised surface"],
  ["--focus", "--bg", UI, "focus ring"],
  ["--focus", "--raised", UI, "focus ring on raised surface"],
  ["--error", "--bg", UI, "error underline"],
];

const SURFACES = { light: '[data-surface="light"]', dark: '[data-surface="dark"]' };

const css = readFileSync(fileURLToPath(new URL("../src/styles/tokens.css", import.meta.url)), "utf8");
const blocks = parseBlocks(css);

let failures = 0;
const rows = [];
for (const [surface, selector] of Object.entries(SURFACES)) {
  const resolve = resolver(blocks, selector);
  for (const [fg, bg, min, use, only] of PAIRS) {
    if (only && only !== surface) continue;
    const ratio = contrast(resolve(fg), resolve(bg));
    const ok = ratio >= min;
    if (!ok) failures++;
    rows.push({ surface, pair: `${fg} on ${bg}`, ratio: ratio.toFixed(2), min, result: ok ? "pass" : "FAIL", use });
  }
}

console.table(rows);
if (failures) {
  console.error(`\n${failures} pair(s) below WCAG AA.`);
  process.exit(1);
}
console.log(`\nAll ${rows.length} pairs meet WCAG AA.`);
