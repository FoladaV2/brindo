import Link from "next/link";
import { copy } from "@content/copy.ka";
import { PERIODS, type AdminStats, type Period } from "@/lib/admin/stats";
import { formatPriceShort } from "@/lib/payments/price";
import { QUESTIONS } from "@/lib/onboarding/questions";
import { fill } from "@/lib/text";
import { cn } from "@/lib/utils";
import { AdminHeading, AdminShell, Kpi, Panel, Unavailable } from "./admin-shell";
import { BarList, DailyBars, Funnel } from "./charts";
import { UnlimitedAccess } from "./unlimited-access";

const t = copy.admin;

/** The admin overview: period, then stats (or why they're missing), then unlimited access. */
export function AdminView({ days, stats, basePath = "/admin" }: { days: Period; stats: AdminStats | null; basePath?: string }) {
  return (
    <AdminShell active="overview" basePath={basePath}>
      <AdminHeading heading={t.heading} lead={t.lead}>
        <nav aria-label={t.periodLabel} className="inline-flex rounded-full bg-sunken p-1">
          {PERIODS.map((p) => (
            <Link
              key={p}
              href={`${basePath}?days=${p}`}
              aria-current={p === days ? "page" : undefined}
              className={cn("rounded-full px-4 py-2 text-sm text-muted-foreground hover:text-foreground", p === days && "bg-card font-medium text-foreground shadow-float")}
            >
              {fill(t.period, { n: p })}
            </Link>
          ))}
        </nav>
      </AdminHeading>

      {stats ? <Stats stats={stats} /> : <Unavailable heading={t.unavailable.heading} body={t.unavailable.body} />}

      <Panel title={t.unlimited.title} lead={t.unlimited.lead}>
        <UnlimitedAccess entitlements={stats?.entitlements ?? []} />
      </Panel>
    </AdminShell>
  );
}

function Stats({ stats }: { stats: AdminStats }) {
  const registered = stats.funnel.find((s) => s.key === "registered")?.count ?? 0;
  const published = stats.totals.publishedPaid + stats.totals.publishedFree;
  const answersBy = new Map<string, { label: string; value: number }[]>();
  for (const row of stats.onboarding) {
    const question = QUESTIONS.find((q) => q.id === row.question);
    if (!question) continue;
    const options = copy.onboarding.questions[question.id].options as Record<string, string>;
    answersBy.set(row.question, [...(answersBy.get(row.question) ?? []), { label: options[row.answer] ?? row.answer, value: row.hosts }]);
  }

  return (
    <>
      <section aria-label={t.heading} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t.kpis.visitors} value={stats.visitors} detail={fill(t.kpis.views, { n: stats.views })} />
        <Kpi label={t.kpis.registered} value={registered} detail={fill(t.kpis.skipped, { n: stats.onboardingSkipped })} />
        <Kpi label={t.kpis.published} value={published} detail={fill(t.kpis.publishedSplit, { paid: stats.totals.publishedPaid, free: stats.totals.publishedFree })} />
        <Kpi
          label={t.kpis.revenue}
          value={formatPriceShort({ amount: stats.totals.revenueMinor, currency: "GEL" })}
          detail={fill(t.kpis.checkouts, { n: stats.startedPayment })}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <Panel title={t.daily.title}>
          <DailyBars daily={stats.daily} />
        </Panel>
        <Panel title={t.kpis.answers}>
          <div className="grid gap-1">
            <span className="font-display text-[clamp(3rem,2.5rem+2vw,4.5rem)] leading-none tabular">{stats.totals.answers}</span>
            <span className="text-muted-foreground">{fill(t.kpis.people, { n: stats.totals.peopleComing })}</span>
          </div>
        </Panel>
      </div>

      <Panel title={t.funnel.title} lead={t.funnel.lead}>
        <Funnel steps={stats.funnel} />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={t.pages}>
          <BarList rows={stats.pages.map((r) => ({ label: r.label, value: r.visitors }))} empty={t.empty} />
        </Panel>
        <Panel title={t.referrers}>
          <BarList rows={stats.referrers.map((r) => ({ label: r.label || t.direct, value: r.visitors }))} empty={t.empty} />
        </Panel>
        <Panel title={t.devices}>
          <BarList
            rows={stats.devices.map((r) => ({ label: t.deviceNames[r.label as keyof typeof t.deviceNames] ?? r.label, value: r.visitors }))}
            empty={t.empty}
          />
        </Panel>
      </div>

      <Panel title={t.onboarding.title} lead={t.onboarding.lead}>
        {answersBy.size === 0 ? (
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <div className="grid gap-8 md:grid-cols-2">
            {QUESTIONS.filter((q) => answersBy.has(q.id)).map((q) => (
              <div key={q.id} className="grid gap-4">
                <h3 className="text-sm font-medium">{copy.onboarding.questions[q.id].title}</h3>
                <BarList rows={answersBy.get(q.id)!} empty={t.empty} />
              </div>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
