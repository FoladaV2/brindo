import localFont from "next/font/local";
import { Noto_Sans_Georgian } from "next/font/google";

// Display: TBC Contractica CAPS, subset to Latin + Georgian (see README for the subset command).
// TTF copies stay in assets/fonts for OG images. Bold exists but is not loaded until a design needs it.
export const display = localFont({
  src: [
    { path: "../../assets/fonts/TBCContracticaCAPS-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../assets/fonts/TBCContracticaCAPS-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-brindo-display",
  display: "swap",
  adjustFontFallback: "Arial",
});

// Body and UI: Noto Sans Georgian (variable weight). Georgian and Latin subsets only.
export const body = Noto_Sans_Georgian({
  subsets: ["georgian", "latin"],
  variable: "--font-brindo-body",
  display: "swap",
});
