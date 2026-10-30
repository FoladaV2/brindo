import { Invitation, type Look } from "../shared/Invitation";
import type { TemplateProps } from "../types";

const LOOK: Look = {
  id: "lumiere",
  surface: "light",
  photo: "arch",
  sweepDelay: null,
};

/**
 * Lumière: the light template. Morning light in a gallery: ivory and paper, ink type, champagne
 * details, the photo in a small arched window beside the title.
 */
export function Lumiere(props: TemplateProps) {
  return <Invitation look={LOOK} {...props} />;
}
