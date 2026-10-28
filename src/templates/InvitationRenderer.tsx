import type { ComponentType } from "react";
import { isTemplateId, type TemplateId } from "./registry";
import type { TemplateProps } from "./types";
import { Lumiere } from "./lumiere/Lumiere";

const COMPONENTS: Record<TemplateId, ComponentType<TemplateProps>> = {
  lumiere: Lumiere,
};

type InvitationRendererProps = TemplateProps & { templateId: string };

/** Renders validated invitation content with the chosen template. */
export function InvitationRenderer({ templateId, ...props }: InvitationRendererProps) {
  if (!isTemplateId(templateId)) throw new Error(`Unknown template: ${templateId}`);
  const Template = COMPONENTS[templateId];
  return <Template {...props} />;
}
