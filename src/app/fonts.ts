import localFont from "next/font/local";

// TBC Contractica CAPS, subset to Latin + Georgian (see README for the subset command), is the only
// typeface: display, body and UI. TTF copies stay in assets/fonts for OG images. Bold exists but is
// not loaded until a design needs it: every weight loaded is one more file on every guest's phone.
export const display = localFont({
  src: [
    { path: "../../assets/fonts/TBCContracticaCAPS-Regular.woff2", weight: "400", style: "normal" },
    { path: "../../assets/fonts/TBCContracticaCAPS-Medium.woff2", weight: "500", style: "normal" },
  ],
  variable: "--font-brindo-display",
  display: "swap",
  adjustFontFallback: "Arial",
});
