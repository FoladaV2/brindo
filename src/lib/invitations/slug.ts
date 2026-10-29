import { randomInt } from "node:crypto";

// Georgian national romanization (2002), without apostrophes so it stays URL-friendly.
const GEORGIAN: Record<string, string> = {
  ა: "a", ბ: "b", გ: "g", დ: "d", ე: "e", ვ: "v", ზ: "z", თ: "t", ი: "i", კ: "k", ლ: "l",
  მ: "m", ნ: "n", ო: "o", პ: "p", ჟ: "zh", რ: "r", ს: "s", ტ: "t", უ: "u", ფ: "p", ქ: "k",
  ღ: "gh", ყ: "q", შ: "sh", ჩ: "ch", ც: "ts", ძ: "dz", წ: "ts", ჭ: "ch", ხ: "kh", ჯ: "j", ჰ: "h",
};

const SUFFIX_ALPHABET = "abcdefghijkmnpqrstuvwxyz23456789"; // no 0/o, 1/l
const NAME_PART_MAX = 20;

/** Lowercase ASCII slug of a name: Georgian romanized, accents removed, anything else a hyphen. */
export function transliterate(name: string): string {
  return [...name.normalize("NFD")]
    .map((ch) => GEORGIAN[ch] ?? ch)
    .join("")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Four characters from a CSPRNG, so a slug can't be guessed from the names alone. */
export function randomSuffix(length = 4): string {
  return Array.from({ length }, () => SUFFIX_ALPHABET[randomInt(SUFFIX_ALPHABET.length)]).join("");
}

/**
 * "nino-da-giorgi-k7xq" from the couple's given names (the first word of each name). Fits the
 * invitations_slug_format constraint: lowercase, 3–60 characters, no leading or trailing hyphen.
 */
export function slugFromNames(names: readonly [string, string], suffix = randomSuffix()): string {
  const part = (name: string) => transliterate(name.split(/\s+/)[0] ?? "").slice(0, NAME_PART_MAX).replace(/-+$/, "");
  const [a, b] = names.map(part);
  return [a, a && b ? "da" : "", b, suffix].filter(Boolean).join("-");
}

const TITLE_MAX = 40;

/** "anas-30-k7xq" from an event's title: transliterated, cut at a word boundary, random suffix. */
export function slugFromTitle(title: string, suffix = randomSuffix()): string {
  const words = transliterate(title).split("-").filter(Boolean);
  let base = "";
  for (const word of words) {
    const next = base ? `${base}-${word}` : word;
    if (next.length > TITLE_MAX) break;
    base = next;
  }
  if (!base) base = words[0]?.slice(0, TITLE_MAX) ?? "";
  return [base, suffix].filter(Boolean).join("-");
}
