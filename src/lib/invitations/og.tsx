import "server-only";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { copy } from "@content/copy.ka";
import { WORDMARK } from "@/components/ui/wordmark-paths";
import { formatDate } from "@/templates/shared/format";
import { widestNameLineEm } from "./fit";
import { OG_SIZE } from "./og-size";
import { nameParts, type InvitationContent } from "./schema";


// ImageResponse can't read WOFF2: it gets the TTF copies of the display font kept for this purpose.
const fonts = Promise.all(
  ["Regular", "Medium"].map((weight) => readFile(join(process.cwd(), `assets/fonts/TBCContracticaCAPS-${weight}.ttf`))),
);

const INK = "#14110f";
const IVORY = "#faf6ef";
const CHAMPAGNE = "#d9bc84";
const CHAMPAGNE_DEEP = "#82632b";

/**
 * Everything that matters sits in a centered 560 × 560 square. Messenger shows the full 1.91:1
 * card, while Viber and WhatsApp often crop to a centered square; both keep the names and date.
 */
const SAFE = 560;
const NAMES_MAX = 112;
const NAMES_HEIGHT = 330;
const TRACKING_EM = 0.01;

/** The link-preview card: ivory, the halo, the names in the display font, the date and the wordmark. */
export async function renderOgImage(content: InvitationContent, init?: ResponseInit) {
  const [regular, medium] = await fonts;
  const name = (text: string) => ({ text, ampersand: false });
  const lines = [
    ...nameParts(content.partners[0]).map(name),
    { text: copy.invitation.ampersand, ampersand: true },
    ...nameParts(content.partners[1]).map(name),
  ];
  const nameLines = lines.length - 1;
  // Same fitting as the hero: the widest line fills the safe width, all lines fit the name block.
  const size = Math.floor(
    Math.min(NAMES_MAX, (SAFE - 8) / widestNameLineEm(content.partners, TRACKING_EM), NAMES_HEIGHT / ((nameLines + 0.6) * 1.04)),
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
          backgroundColor: IVORY,
          backgroundImage: `radial-gradient(60% 55% at 50% 0%, rgba(217, 188, 132, 0.38), rgba(217, 188, 132, 0) 70%)`,
          fontFamily: "Display",
          color: INK,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: SAFE }}>
          {lines.map((line, i) =>
            line.ampersand ? (
              <div key={i} style={{ display: "flex", fontSize: Math.max(26, size * 0.36), color: CHAMPAGNE, margin: `${size * 0.12}px 0` }}>
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
              color: CHAMPAGNE_DEEP,
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
            <path d={WORDMARK.path} fill={INK} fillOpacity={0.8} />
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
