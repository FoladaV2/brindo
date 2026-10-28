"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { copy } from "@content/copy.ka";
import { devToolsEnabled } from "@/lib/dev";
import { currentUserId, invitationTag } from "@/lib/invitations/access";
import { isOwnPhotoUrl } from "@/lib/invitations/photos";
import { invitationDraftSchema, partnerName } from "@/lib/invitations/schema";
import { slugFromNames } from "@/lib/invitations/slug";
import { supabaseUrl } from "@/lib/supabase/env";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isTemplateId } from "@/templates/registry";

const UNIQUE_VIOLATION = "23505";
const uuid = z.uuid();

export type CreateState = { error?: string; fields?: { partnerA?: boolean; partnerB?: boolean } };

/** Step one: the names. They make the slug, which then never changes (links may already be shared). */
export async function createInvitation(_prev: CreateState, form: FormData): Promise<CreateState> {
  const a = partnerName.safeParse(form.get("partnerA") ?? "");
  const b = partnerName.safeParse(form.get("partnerB") ?? "");
  if (!a.success || !b.success) return { fields: { partnerA: !a.success, partnerB: !b.success } };

  if (!(await currentUserId())) redirect("/login");
  const supabase = await createClient();

  // Four random characters make collisions rare; retry a few times if one happens anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({ slug: slugFromNames([a.data, b.data]), template_id: "lumiere", content: { partners: [a.data, b.data] } })
      .select("id")
      .single();
    if (error?.code === UNIQUE_VIOLATION) continue;
    if (error) return { error: copy.create.failed };
    redirect(`/dashboard/invitations/${data.id}/edit`);
  }
  return { error: copy.create.failed };
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: "invalid" | "notFound" | "failed" };

/**
 * Autosave. Accepts a draft (any field may be empty) that passes the same rules as published
 * content. The id comes from the client, so RLS decides whether this couple may write it.
 */
export async function saveDraft(id: string, templateId: string, input: unknown): Promise<SaveResult> {
  if (!uuid.safeParse(id).success || !isTemplateId(templateId)) return { ok: false, reason: "invalid" };
  const draft = invitationDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, reason: "invalid" };

  const userId = await currentUserId();
  if (!userId) return { ok: false, reason: "notFound" };
  if (draft.data.photo && !isOwnPhotoUrl(draft.data.photo.url, supabaseUrl(), userId)) return { ok: false, reason: "invalid" };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    // JSON round trip: drops undefined fields (an empty partner name is stored as null).
    .update({ content: JSON.parse(JSON.stringify(draft.data)) as Json, template_id: templateId })
    .eq("id", id)
    .select("slug, updated_at")
    .maybeSingle();
  if (error) return { ok: false, reason: "failed" };
  if (!data) return { ok: false, reason: "notFound" };

  updateTag(invitationTag(data.slug));
  return { ok: true, savedAt: data.updated_at };
}

/**
 * Development only: mark an invitation published (or back to draft) without paying. Ownership is
 * checked through RLS first; only then does the service role change the status, which couples
 * can never write themselves.
 */
export async function setPublishedForDev(id: string, published: boolean) {
  if (!devToolsEnabled) throw new Error("Not available");
  if (!uuid.safeParse(id).success) throw new Error("Not found");

  const supabase = await createClient();
  const { data: own } = await supabase.from("invitations").select("slug").eq("id", id).maybeSingle();
  if (!own) throw new Error("Not found");

  const { error } = await createServiceClient()
    .from("invitations")
    .update(published ? { status: "published", paid_at: new Date().toISOString() } : { status: "draft", paid_at: null })
    .eq("id", id);
  if (error) throw error;
  updateTag(invitationTag(own.slug));
}
