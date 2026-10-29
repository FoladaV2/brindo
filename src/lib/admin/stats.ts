import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/** The periods /admin offers, in days. */
export const PERIODS = [7, 30, 90] as const;
export type Period = (typeof PERIODS)[number];

export const parsePeriod = (value: unknown): Period => (PERIODS.includes(Number(value) as Period) ? (Number(value) as Period) : 30);

export type Row = { label: string; views: number; visitors: number };

export type FunnelStep = { key: string; count: number };

export type AdminStats = {
  days: Period;
  visitors: number;
  views: number;
  daily: { day: string; views: number; visitors: number }[];
  pages: Row[];
  referrers: Row[];
  devices: Row[];
  /** From the first visit to the first guest answer. Anonymous steps are visitors; later ones are hosts. */
  funnel: FunnelStep[];
  onboardingSkipped: number;
  startedPayment: number;
  totals: { eventsCreated: number; publishedPaid: number; publishedFree: number; revenueMinor: number; answers: number; peopleComing: number };
  onboarding: { question: string; answer: string; hosts: number }[];
  entitlements: { userId: string; email: string; note: string | null; grantedAt: string }[];
};

/** Every day of the period, oldest first, so days without visits show as gaps of zero. */
function fillDays(rows: { day: string; views: number; visitors: number }[], days: number, now: number) {
  const byDay = new Map(rows.map((r) => [r.day, r]));
  return Array.from({ length: days }, (_, i) => {
    const day = new Date(now + 4 * 3600_000 - (days - 1 - i) * 86400_000).toISOString().slice(0, 10);
    const row = byDay.get(day);
    return { day, views: Number(row?.views ?? 0), visitors: Number(row?.visitors ?? 0) };
  });
}

const rows = (data: { label: string; views: number; visitors: number }[] | null): Row[] =>
  (data ?? []).map((r) => ({ label: r.label, views: Number(r.views), visitors: Number(r.visitors) }));

/**
 * Everything /admin shows, read with the service role through admin-only database functions. Null
 * when they aren't there yet (the admin migration hasn't been applied), so the page can say so.
 * Callers must have checked requireAdmin() first.
 */
export async function loadAdminStats(days: Period, now = Date.now()): Promise<AdminStats | null> {
  const db = createServiceClient();
  const since = new Date(now - days * 86400_000).toISOString();

  const [traffic, visitors, registerVisitors, pages, referrers, devices, funnel, totals, onboarding, entitlements] = await Promise.all([
    db.rpc("admin_traffic", { p_since: since }),
    db.rpc("admin_visitors_on", { p_since: since, p_paths: null }),
    db.rpc("admin_visitors_on", { p_since: since, p_paths: ["/register"] }),
    db.rpc("admin_breakdown", { p_since: since, p_dimension: "path" }),
    db.rpc("admin_breakdown", { p_since: since, p_dimension: "referrer" }),
    db.rpc("admin_breakdown", { p_since: since, p_dimension: "device" }),
    db.rpc("admin_funnel", { p_since: since }),
    db.rpc("admin_totals", { p_since: since }),
    db.rpc("admin_onboarding_answers", { p_since: since }),
    db.rpc("admin_entitlements", {}),
  ]);
  const failed = [traffic, visitors, registerVisitors, pages, referrers, devices, funnel, totals, onboarding, entitlements].find((r) => r.error);
  if (failed) {
    console.error("[admin] stats unavailable", failed.error?.code, failed.error?.message);
    return null;
  }

  const daily = fillDays(traffic.data ?? [], days, now);
  const f = funnel.data?.[0];
  const t = totals.data?.[0];
  return {
    days,
    visitors: Number(visitors.data ?? 0),
    views: daily.reduce((sum, d) => sum + d.views, 0),
    daily,
    pages: rows(pages.data),
    referrers: rows(referrers.data),
    devices: rows(devices.data),
    funnel: [
      { key: "visited", count: Number(visitors.data ?? 0) },
      { key: "registerPage", count: Number(registerVisitors.data ?? 0) },
      { key: "registered", count: Number(f?.registered ?? 0) },
      { key: "onboarded", count: Number(f?.onboarded ?? 0) },
      { key: "createdEvent", count: Number(f?.created_event ?? 0) },
      { key: "published", count: Number(f?.published ?? 0) },
      { key: "gotAnswer", count: Number(f?.got_answer ?? 0) },
    ],
    onboardingSkipped: Number(f?.onboarding_skipped ?? 0),
    startedPayment: Number(f?.started_payment ?? 0),
    totals: {
      eventsCreated: Number(t?.events_created ?? 0),
      publishedPaid: Number(t?.published_paid ?? 0),
      publishedFree: Number(t?.published_free ?? 0),
      revenueMinor: Number(t?.revenue_minor ?? 0),
      answers: Number(t?.answers ?? 0),
      peopleComing: Number(t?.people_coming ?? 0),
    },
    onboarding: (onboarding.data ?? []).map((r) => ({ question: r.question, answer: r.answer, hosts: Number(r.hosts) })),
    entitlements: (entitlements.data ?? []).map((e) => ({ userId: e.user_id, email: e.email, note: e.note, grantedAt: e.granted_at })),
  };
}
