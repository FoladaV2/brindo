import "server-only";
import { slugSchema } from "./slug-format";
import { isEventType, type EventType } from "@/lib/events";
import type { Json } from "@/lib/supabase/database.types";
import { createServiceClient } from "@/lib/supabase/service";

/** What a guest's page needs to render. Nothing about the owner, payment or answers. */
export type PublishedInvitation = {
  slug: string;
  templateId: string;
  eventType: EventType;
  maxPartySize: number;
  content: Json;
  /** Changes on every edit; versions the link-preview image URL. */
  updatedAt: string;
};

export { slugSchema };

/**
 * The only way public pages read invitations. anon has no access to the table, so this runs with
 * the service role and filters to published invitations itself.
 */
export async function getPublishedInvitationBySlug(slug: string): Promise<PublishedInvitation | null> {
  if (!slugSchema.safeParse(slug).success) return null;

  const { data, error } = await createServiceClient()
    .from("invitations")
    .select("slug, template_id, event_type, max_party_size, content, updated_at")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) throw error;
  return (
    data && {
      slug: data.slug,
      templateId: data.template_id,
      eventType: isEventType(data.event_type) ? data.event_type : "other",
      maxPartySize: data.max_party_size,
      content: data.content,
      updatedAt: data.updated_at,
    }
  );
}
