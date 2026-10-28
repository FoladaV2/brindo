import { Invitation, type Look } from "../shared/Invitation";
import type { TemplateProps } from "../types";

const LOOK: Look = {
  id: "lumiere",
  surface: "light",
  haloDrift: true,
  rsvpHalo: "champagne",
  unveilDelay: 120,
  sweepDelay: 400,
  photo: "parallax",
};

/** Lumière: the light template. Morning light in a gallery: ivory, ink, champagne hairlines, a lot of air. */
export function Lumiere(props: TemplateProps) {
  return <Invitation look={LOOK} {...props} />;
}
