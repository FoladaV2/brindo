import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { copy } from "@content/copy.ka";
import { WORDMARK } from "@/components/brand/wordmark-paths";
import { formatDate } from "@/templates/shared/format";
import { widestNameLineEm } from "./fit";
import { OG_SIZE } from "./og-size";
import { heroLines, titleWords, type InvitationContent } from "./schema";


// ImageResponse can't read WOFF2: it gets the TTF copies of the display font kept for this purpose.
const fonts = Promise.all(
  ["Regular", "Medium"].map((weight) => readFile(join(process.cwd(), `assets/fonts/TBCContracticaCAPS-${weight}.ttf`))),
);

const INK = "#14110f";
const IVORY = "#faf6ef";
const CHAMPAGNE = "#d9bc84";
const CHAMPAGNE_DEEP = "#82632b";
const MUTED_DARK = "#a89f93";

/** The card follows the template's surface: Lumière's ivory and champagne halo, Noir's ink and moonlight. */
const PALETTES = {
  light: {
    background: IVORY,
    halo: "radial-gradient(60% 55% at 50% 0%, rgba(217, 188, 132, 0.38), rgba(217, 188, 132, 0) 70%)",
    names: INK,
    ampersand: CHAMPAGNE,
    date: CHAMPAGNE_DEEP,
    wordmark: INK,
    wordmarkOpacity: 0.8,
  },
  dark: {
    background: INK,
    halo: "radial-gradient(60% 58% at 50% 0%, rgba(250, 240, 220, 0.2), rgba(217, 188, 132, 0.09) 40%, rgba(217, 188, 132, 0) 72%)",
    names: CHAMPAGNE,
    ampersand: MUTED_DARK,
    date: CHAMPAGNE,
    wordmark: IVORY,
    wordmarkOpacity: 0.85,
  },
} as const;

/**
 * Everything that matters sits in a centered 560 × 560 square. Messenger shows the full 1.91:1
 * card, while Viber and WhatsApp often crop to a centered square; both keep the names and date.
 */
const SAFE = 560;
const NAMES_MAX = 112;
const NAMES_HEIGHT = 330;
const TRACKING_EM = 0.01;

/** The link-preview card: the template's surface, the halo, the names in the display font, the date and the wordmark. */
export async function renderOgImage(content: InvitationContent, surface: "light" | "dark", init?: ResponseInit) {
  const [regular, medium] = await fonts;
  const palette = PALETTES[surface];
  const lines = heroLines(content).map((line) => (line.ampersand ? { ...line, text: copy.invitation.ampersand } : line));
  const nameLines = lines.filter((line) => !line.ampersand).length;
  const ampersands = lines.length - nameLines;
  // Same fitting as the hero: the widest line fills the safe width, all lines fit the name block.
  const size = Math.floor(
    Math.min(NAMES_MAX, (SAFE - 8) / widestNameLineEm(titleWords(content), TRACKING_EM), NAMES_HEIGHT / ((nameLines + 0.6 * ampersands) * 1.04)),
  );
  const date = formatDate(content.startsAt);
  const wordmarkHeight = 26;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: palette.background,
          backgroundImage: palette.halo,
          fontFamily: "Display",
          color: palette.names,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: SAFE }}>
          {lines.map((line, i) =>
            line.ampersand ? (
              <div key={i} style={{ display: "flex", fontSize: Math.max(26, size * 0.36), color: palette.ampersand, margin: `${size * 0.12}px 0` }}>
                {line.text}
              </div>
            ) : (
              <div key={i} style={{ display: "flex", fontSize: size, lineHeight: 1.04, letterSpacing: `${TRACKING_EM}em` }}>
                {line.text}
              </div>
            ),
          )}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              marginTop: 34,
              fontSize: 21,
              fontWeight: 500,
              letterSpacing: "0.22em",
              color: palette.date,
            }}
          >
            {`${date.weekday} · ${date.day} ${date.month} ${date.year}`}
          </div>
          <svg
            width={Math.round((WORDMARK.width / WORDMARK.height) * wordmarkHeight)}
            height={wordmarkHeight}
            viewBox={`0 0 ${WORDMARK.width} ${WORDMARK.height}`}
            style={{ marginTop: 40 }}
          >
            <path d={WORDMARK.path} fill={palette.wordmark} fillOpacity={palette.wordmarkOpacity} />
            <circle cx={WORDMARK.bubble.cx} cy={WORDMARK.bubble.cy} r={WORDMARK.bubble.r} fill={CHAMPAGNE} />
          </svg>
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: "Display", data: regular, weight: 400, style: "normal" },
        { name: "Display", data: medium, weight: 500, style: "normal" },
      ],
      ...init,
    },
  );
}
