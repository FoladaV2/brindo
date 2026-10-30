import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import type { AdminEvent, AdminUser } from "./results";

/**
 * Every account, newest first, read with the service role. Null when the function isn't there yet
 * (the migration hasn't been applied), so the page can say so. Callers must have checked
 * requireAdmin() first.
 */
export async function loadAdminUsers(): Promise<AdminUser[] | null> {
  const { data, error } = await createServiceClient().rpc("admin_users", {});
  if (error) {
    console.error("[admin] users unavailable", error.code, error.message);
    return null;
  }
  return (data ?? []).map((u) => ({
    id: u.user_id,
    email: u.email,
    createdAt: u.created_at,
    lastSignInAt: u.last_sign_in_at,
    onboarding: u.onboarding === "done" || u.onboarding === "skipped" ? u.onboarding : "none",
    city: u.city,
    planning: u.planning,
    events: Number(u.events),
    published: Number(u.published),
    answers: Number(u.answers),
    peopleComing: Number(u.people_coming),
    unlimited: u.unlimited,
  }));
}

/** Every event with its answers counted, newest first. Same rules as loadAdminUsers. */
export async function loadAdminEvents(): Promise<AdminEvent[] | null> {
  const { data, error } = await createServiceClient().rpc("admin_events", {});
  if (error) {
    console.error("[admin] events unavailable", error.code, error.message);
    return null;
  }
  return (data ?? []).map((e) => ({
    id: e.invitation_id,
    email: e.email,
    eventType: e.event_type,
    templateId: e.template_id,
    title: e.title,
    startsAt: e.starts_at,
    status: e.status === "paid" || e.status === "published" ? e.status : "draft",
    publishedFree: e.published_free,
    createdAt: e.created_at,
    paidAt: e.paid_at,
    answers: Number(e.answers),
    coming: Number(e.coming),
    notComing: Number(e.not_coming),
    peopleComing: Number(e.people_coming),
  }));
}
