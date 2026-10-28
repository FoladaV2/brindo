/**
 * Every invitation template. Metadata only, so the editor and the template picker can list
 * templates without pulling their components; InvitationRenderer maps ids to components.
 * Ids must match the invitations_template_id_known constraint in the database.
 */
export const TEMPLATES = {
  lumiere: {
    id: "lumiere",
    displayName: "Lumière",
    thumbnail: "/templates/lumiere.webp",
    surface: "light",
  },
} as const satisfies Record<string, { id: string; displayName: string; thumbnail: string; surface: "light" | "dark" }>;

export type TemplateId = keyof typeof TEMPLATES;

export function isTemplateId(id: string): id is TemplateId {
  return Object.hasOwn(TEMPLATES, id);
}
