"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { z } from "zod";
import { copy } from "@content/copy.ka";
import { devToolsEnabled } from "@/lib/dev";
import { currentUserId, invitationTag } from "@/lib/invitations/access";
import { isOwnPhotoUrl } from "@/lib/invitations/photos";
import { EVENT_TYPES, isCoupleEvent, isEventType } from "@/lib/events";
import { eventTitle, invitationDraftSchema, partnerName } from "@/lib/invitations/schema";
import { slugFromNames, slugFromTitle } from "@/lib/invitations/slug";
import { RESPONSE_LIMITS } from "@/lib/responses/schema";
import { supabaseUrl } from "@/lib/supabase/env";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { flash } from "@/lib/flash";
import { isTemplateId } from "@/templates/registry";

const UNIQUE_VIOLATION = "23505";
const uuid = z.uuid();

export type CreateState = {
  error?: string;
  fields?: { partnerA?: string; partnerB?: string; title?: string };
  /** What the host typed, so the form keeps it after a rejected submit. */
  values?: { eventType: string; partnerA: string; partnerB: string; title: string };
};

const c = copy.create.errors;
/** The first problem with one field, in Georgian. */
const problem = (result: { success: boolean; error?: z.ZodError }, kind: "name" | "title") =>
  result.success ? undefined : result.error?.issues.some((i) => i.code === "too_small") ? c.required : c[kind];

/**
 * Step one: the event type and what it is called (two names, or one title). They make the slug,
 * which then never changes (links may already be shared).
 */
export async function createInvitation(_prev: CreateState, form: FormData): Promise<CreateState> {
  const values = {
    eventType: String(form.get("eventType") ?? ""),
    partnerA: String(form.get("partnerA") ?? ""),
    partnerB: String(form.get("partnerB") ?? ""),
    title: String(form.get("title") ?? ""),
  };
  if (!isEventType(values.eventType)) return { error: copy.create.failed, values };
  const eventType = values.eventType;

  let content: { partners: [string, string] } | { title: string };
  let slug: () => string;
  if (isCoupleEvent(eventType)) {
    const a = partnerName.safeParse(values.partnerA);
    const b = partnerName.safeParse(values.partnerB);
    if (!a.success || !b.success) return { fields: { partnerA: problem(a, "name"), partnerB: problem(b, "name") }, values };
    content = { partners: [a.data, b.data] };
    slug = () => slugFromNames([a.data, b.data]);
  } else {
    const title = eventTitle.safeParse(values.title);
    if (!title.success) return { fields: { title: problem(title, "title") }, values };
    content = { title: title.data };
    slug = () => slugFromTitle(title.data);
  }

  if (!(await currentUserId())) redirect("/login");
  const supabase = await createClient();

  // Four random characters make collisions rare; retry a few times if one happens anyway.
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data, error } = await supabase
      .from("invitations")
      .insert({ slug: slug(), template_id: "lumiere", event_type: eventType, content })
      .select("id")
      .single();
    if (error?.code === UNIQUE_VIOLATION) continue;
    if (error) return { error: copy.create.failed, values };
    await flash("created");
    redirect(`/dashboard/invitations/${data.id}/edit`);
  }
  return { error: copy.create.failed, values };
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; reason: "invalid" | "notFound" | "failed" };

const settingsSchema = z.object({
  templateId: z.string().refine(isTemplateId),
  eventType: z.enum(EVENT_TYPES),
  maxPartySize: z.number().int().min(1).max(RESPONSE_LIMITS.partySize),
});

/**
 * Autosave. Accepts a draft (any field may be empty) that passes the same rules as published
 * content, plus the template, event type and party-size cap. The id comes from the client, so RLS
 * decides whether this host may write it.
 */
export async function saveDraft(id: string, settings: unknown, input: unknown): Promise<SaveResult> {
  const parsedSettings = settingsSchema.safeParse(settings);
  if (!uuid.safeParse(id).success || !parsedSettings.success) return { ok: false, reason: "invalid" };
  const draft = invitationDraftSchema.safeParse(input);
  if (!draft.success) return { ok: false, reason: "invalid" };

  const userId = await currentUserId();
  if (!userId) return { ok: false, reason: "notFound" };
  if (draft.data.photo && !isOwnPhotoUrl(draft.data.photo.url, supabaseUrl(), userId)) return { ok: false, reason: "invalid" };

  const { templateId, eventType, maxPartySize } = parsedSettings.data;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invitations")
    // JSON round trip: drops undefined fields (an empty name is stored as null).
    .update({ content: JSON.parse(JSON.stringify(draft.data)) as Json, template_id: templateId, event_type: eventType, max_party_size: maxPartySize })
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
