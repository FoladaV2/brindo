import type { EventType } from "@/lib/events";
import type { Json } from "@/lib/supabase/database.types";
import { placeholderDate, previewContent } from "@/lib/invitations/preview";
import { invitationContentSchema, invitationDraftSchema, type InvitationContent } from "@/lib/invitations/schema";

/**
 * Content to render on /i/[slug]. Published content must be complete; the owner's draft preview
 * fills empty fields with placeholders. Null if stored content no longer fits the schema.
 */
export function pageContent(content: Json, isDraftPreview: boolean, updatedAt: string, eventType: EventType): InvitationContent | null {
  if (!isDraftPreview) {
    const parsed = invitationContentSchema.safeParse(content);
    return parsed.success ? parsed.data : null;
  }
  const draft = invitationDraftSchema.safeParse(content);
  return previewContent(draft.success ? draft.data : {}, placeholderDate(new Date(updatedAt)), eventType);
}

/** Changes whenever the invitation does, so link previews refetch the image after an edit. */
export const imageVersion = (updatedAt: string) => Date.parse(updatedAt).toString(36);
