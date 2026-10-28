import { Invitation, type Look } from "../shared/Invitation";
import type { TemplateProps } from "../types";
import "./noir.css";

const LOOK: Look = {
  id: "noir",
  surface: "dark",
  // The moonlight stays still: the photo's slow zoom is this page's one ambient animation.
  haloDrift: false,
  rsvpHalo: "surface",
  unveilDelay: 300,
  // The names are mostly up before the light crosses them (noir.css slows the unveil).
  sweepDelay: 1300,
  photo: "framed",
};

/**
 * Noir: the dark template. A candlelit dinner: ink and graphite, champagne type and hairlines,
 * moonlight from the top, slower and more dramatic motion (see noir.css).
 */
export function Noir(props: TemplateProps) {
  return <Invitation look={LOOK} {...props} />;
}
