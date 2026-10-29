"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { copy } from "@content/copy.ka";
import { requireAdmin } from "@/lib/admin/access";
import { createServiceClient } from "@/lib/supabase/service";

const t = copy.admin.unlimited;

export type GrantState = { ok?: boolean; error?: string };

const grantSchema = z.object({
  email: z.email().max(254),
  note: z.string().trim().max(200).optional(),
});

/** Gives an existing account unlimited access (publishing without paying). Admins only. */
export async function grantUnlimited(_prev: GrantState, form: FormData): Promise<GrantState> {
  const admin = await requireAdmin();
  const parsed = grantSchema.safeParse({ email: String(form.get("email") ?? "").trim(), note: String(form.get("note") ?? "") || undefined });
  if (!parsed.success) return { error: t.errors.invalid };

  const db = createServiceClient();
  const { data: userId, error: lookupError } = await db.rpc("admin_user_id_by_email", { p_email: parsed.data.email });
  if (lookupError) return { error: t.errors.failed };
  if (!userId) return { error: t.errors.noAccount };

  const { error } = await db
    .from("entitlements")
    .upsert({ user_id: userId, note: parsed.data.note || null, granted_by: admin.id }, { onConflict: "user_id" });
  if (error) {
    console.error("[admin] grant failed", error.code);
    return { error: t.errors.failed };
  }
  revalidatePath("/admin");
  return { ok: true };
}

/** Takes unlimited access away. Already published invitations stay published. Admins only. */
export async function revokeUnlimited(userId: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  if (!z.uuid().safeParse(userId).success) return { ok: false };
  const { error } = await createServiceClient().from("entitlements").delete().eq("user_id", userId);
  if (error) {
    console.error("[admin] revoke failed", error.code);
    return { ok: false };
  }
  revalidatePath("/admin");
  return { ok: true };
}
