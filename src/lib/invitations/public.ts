import "server-only";
import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import { createServiceClient } from "@/lib/supabase/service";

/** What a guest's page needs to render. Nothing about the owner, payment or guests. */
export type PublishedInvitation = {
  slug: string;
  templateId: string;
  content: Json;
  /** Changes on every edit; versions the link-preview image URL. */
  updatedAt: string;
};

// Same rule as the invitations_slug_format constraint; rejects junk before it reaches the database.
export const slugSchema = z.string().regex(/^[a-z0-9][a-z0-9-]{1,58}[a-z0-9]$/);

/**
 * The only way public pages read invitations. anon has no access to the table, so this runs with
 * the service role and filters to published invitations itself.
 */
export async function getPublishedInvitationBySlug(slug: string): Promise<PublishedInvitation | null> {
  if (!slugSchema.safeParse(slug).success) return null;

  const { data, error } = await createServiceClient()
    .from("invitations")
    .select("slug, template_id, content, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return data && { slug: data.slug, templateId: data.template_id, content: data.content, updatedAt: data.updated_at };
}
