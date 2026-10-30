import { Invitation, type Look } from "../shared/Invitation";
import type { TemplateProps } from "../types";

const LOOK: Look = {
  id: "lumiere",
  surface: "light",
  poster: "arch",
  sweepDelay: null,
};

/**
 * Lumière: the light template. Morning light in a gallery: a framed ivory card with a double
 * hairline, the photo in an arched window, ink type, champagne details.
 */
export function Lumiere(props: TemplateProps) {
  return <Invitation look={LOOK} {...props} />;
}
