"use server";

import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { copy } from "@content/copy.ka";
import { hasUnlimitedAccess } from "@/lib/entitlements";
import { invitationTag } from "@/lib/invitations/access";
import { publishFree } from "@/lib/invitations/publish-free";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export type PublishFreeState = { error?: string };

/**
 * Publish without paying, for hosts with unlimited access. The only input is the invitation id;
 * RLS decides whether it is theirs and the entitlement is read on the server.
 */
export async function publishWithoutPaying(invitationId: string): Promise<PublishFreeState> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) redirect("/login");

  const published: { slug: string | null } = { slug: null };
  const result = await publishFree(invitationId, {
    userId,
    hasUnlimitedAccess,
    findOwnInvitation: async (id) => {
      const { data, error } = await supabase.from("invitations").select("id, status, content").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
    publish: async (id) => {
      const { data, error } = await createServiceClient()
        .from("invitations")
        .update({ status: "published", paid_at: new Date().toISOString(), published_free: true })
        .eq("id", id)
        .eq("status", "draft")
        .select("slug")
        .maybeSingle();
      if (error) {
        console.error("[publish] free publish failed", error.code);
        return false;
      }
      published.slug = data?.slug ?? null;
      return data !== null;
    },
  }).catch((error) => {
    console.error("[publish] free publish failed", error);
    return { ok: false as const, error: "failed" as const };
  });

  if (!result.ok) return { error: copy.editor.publishFree.errors[result.error] };
  if (published.slug) updateTag(invitationTag(published.slug));
  redirect(`/dashboard/invitations/${invitationId}/done`);
}
