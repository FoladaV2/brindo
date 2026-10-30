import { Invitation, type Look } from "../shared/Invitation";
import type { TemplateProps } from "../types";
import "./noir.css";

const LOOK: Look = {
  id: "noir",
  surface: "dark",
  poster: "bleed",
  // The title is up before the light crosses it.
  sweepDelay: 1100,
};

/**
 * Noir: the dark template. A candlelit dinner: the photo full-bleed under a wash of ink, champagne
 * type and hairlines, moonlight from the top, one slow light sweep across the title (see noir.css).
 */
export function Noir(props: TemplateProps) {
  return <Invitation look={LOOK} {...props} />;
}
