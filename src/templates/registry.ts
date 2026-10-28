/**
 * Every invitation template. Metadata only, so the editor and the template picker can list
 * templates without pulling their components; InvitationRenderer maps ids to components.
 * Ids must match the invitations_template_id_known constraint in the database.
 * Thumbnails are rendered from the real templates: scripts/build-thumbnails.mjs.
 */
export const TEMPLATES = {
  lumiere: {
    id: "lumiere",
    displayName: "Lumière",
    thumbnail: "/templates/lumiere.webp",
    surface: "light",
  },
  noir: {
    id: "noir",
    displayName: "Noir",
    thumbnail: "/templates/noir.webp",
    surface: "dark",
  },
} as const satisfies Record<string, { id: string; displayName: string; thumbnail: string; surface: "light" | "dark" }>;

export type TemplateId = keyof typeof TEMPLATES;

export function isTemplateId(id: string): id is TemplateId {
  return Object.hasOwn(TEMPLATES, id);
}

/** The template's surface, for things rendered outside it (link-preview image, browser theme color). */
export function templateSurface(id: string): "light" | "dark" {
  return isTemplateId(id) ? TEMPLATES[id].surface : "light";
}
