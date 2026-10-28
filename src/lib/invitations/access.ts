import "server-only";
import { cache } from "react";
import { cacheLife, cacheTag } from "next/cache";
import { z } from "zod";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import { getPublishedInvitationBySlug, slugSchema } from "./public";

export type InvitationStatus = "draft" | "paid" | "published";

/** A couple's own invitation, read through RLS. */
export type OwnInvitation = {
  id: string;
  slug: string;
  templateId: string;
  content: Json;
  status: InvitationStatus;
  updatedAt: string;
};

const COLUMNS = "id, slug, template_id, content, status, updated_at";
const uuid = z.uuid();

type Row = { id: string; slug: string; template_id: string; content: Json; status: string; updated_at: string };
const toOwn = (row: Row): OwnInvitation => ({
  id: row.id,
  slug: row.slug,
  templateId: row.template_id,
  content: row.content,
  status: row.status as InvitationStatus,
  updatedAt: row.updated_at,
});

/** Cache tag for everything rendered from one invitation. Saving or publishing must update it. */
export const invitationTag = (slug: string) => `invitation:${slug}`;

/** The signed-in couple's user id (from the verified session JWT), or null for a guest. */
export async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims.sub ?? null;
}

/** All of the signed-in couple's invitations, newest edits first. RLS returns no one else's. */
export async function listOwnInvitations(): Promise<OwnInvitation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("invitations").select(COLUMNS).order("updated_at", { ascending: false });
  if (error) throw error;
  return data.map(toOwn);
}

/**
 * One of the couple's invitations by id. Null for someone else's: RLS hides the row.
 * Deduplicated per request, so metadata and page share one lookup.
 */
export const getOwnInvitation = cache(async (id: string): Promise<OwnInvitation | null> => {
  if (!uuid.safeParse(id).success) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("invitations").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw error;
  return data && toOwn(data);
});

async function getOwnInvitationBySlug(slug: string): Promise<OwnInvitation | null> {
  if (!(await currentUserId())) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("invitations").select(COLUMNS).eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data && toOwn(data);
}

/** A published invitation for anyone (guests, link-preview bots). Cached until the invitation changes. */
export async function getPublishedInvitation(slug: string) {
  "use cache";
  cacheTag(invitationTag(slug));
  cacheLife("hours");
  return getPublishedInvitationBySlug(slug);
}

export type InvitationPage = {
  slug: string;
  templateId: string;
  content: Json;
  updatedAt: string;
  /** The owner looking at an invitation that isn't published yet. */
  isDraftPreview: boolean;
};

/**
 * What /i/[slug] shows this visitor: the published invitation for anyone, the unpublished one only
 * to its owner (RLS decides), otherwise nothing. Deduplicated per request, so metadata and page
 * share one lookup.
 */
export const resolveInvitationPage = cache(async (slug: string): Promise<InvitationPage | null> => {
  if (!slugSchema.safeParse(slug).success) return null;
  const published = await getPublishedInvitation(slug);
  if (published) return { ...published, isDraftPreview: false };
  const own = await getOwnInvitationBySlug(slug);
  return own && { slug: own.slug, templateId: own.templateId, content: own.content, updatedAt: own.updatedAt, isDraftPreview: true };
});
