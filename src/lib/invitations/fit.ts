import { ADVANCE, FALLBACK_ADVANCE, UNITS_PER_EM } from "./display-metrics";
import { nameParts } from "./schema";

/** Width of a string in the display font, in em, including letter-spacing after every character. */
export function displayWidthEm(text: string, letterSpacingEm = 0): number {
  let units = 0;
  for (const ch of text) units += ADVANCE[ch] ?? FALLBACK_ADVANCE;
  return units / UNITS_PER_EM + [...text].length * letterSpacingEm;
}

/** Width, in em, of the widest line the hero will set when every name part sits on its own line. */
export function widestNameLineEm(names: readonly string[], letterSpacingEm = 0): number {
  return Math.max(...names.flatMap(nameParts).map((part) => displayWidthEm(part, letterSpacingEm)));
}
