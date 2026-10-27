/**
 * True when a string is only Latin letters, digits and common punctuation, so uppercasing it is safe.
 * Georgian must never be uppercased (it can become Mtavruli, which the display font lacks).
 */
export function isLatinOnly(text: string): boolean {
  return /^[\x20-\x7E -ÿ‐-‧‰-⁞]*$/.test(text);
}
