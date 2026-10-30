"use client";

import { useDeferredValue, useState, type ReactNode } from "react";
import { Search } from "lucide-react";
import { copy } from "@content/copy.ka";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { tbilisiDay, type AdminUser } from "@/lib/admin/results";
import { fill } from "@/lib/text";
import { formatLongDate } from "@/templates/shared/format";
import { Kpi } from "../admin-shell";

const t = copy.admin.users;
const cities = copy.onboarding.questions.city.options as Record<string, string>;
const types = copy.events.types as Record<string, string>;

const day = (iso: string | null) => (iso ? formatLongDate(tbilisiDay(iso)) : t.never);
/** What they answered in onboarding: city and what they're planning. */
const details = (u: AdminUser) => [u.city && (cities[u.city] ?? u.city), u.planning && (types[u.planning] ?? u.planning)].filter(Boolean).join(" · ") || "·";

/** Every account: four totals, a search by email, then a table (cards on phones). */
export function UsersView({ users }: { users: AdminUser[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query.trim().toLowerCase());
  const shown = deferred ? users.filter((u) => u.email.toLowerCase().includes(deferred)) : users;

  return (
    <>
      <section aria-label={t.heading} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t.kpis.total} value={users.length} detail={fill(t.count, { n: users.length })} />
        <Kpi label={t.kpis.onboarded} value={users.filter((u) => u.onboarding === "done").length} detail={`${t.onboarding.skipped}: ${users.filter((u) => u.onboarding === "skipped").length}`} />
        <Kpi label={t.kpis.withEvents} value={users.filter((u) => u.events > 0).length} detail={`${t.columns.events}: ${users.reduce((n, u) => n + u.events, 0)}`} />
        <Kpi label={t.kpis.published} value={users.filter((u) => u.published > 0).length} detail={`${t.unlimited}: ${users.filter((u) => u.unlimited).length}`} />
      </section>

      <div className="grid gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="relative w-full max-w-sm">
            <span className="sr-only">{t.search}</span>
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} aria-hidden />
            <Input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t.search} className="pl-11" autoComplete="off" />
          </label>
          <span className="text-sm text-muted-foreground tabular" aria-live="polite">
            {fill(t.count, { n: shown.length })}
          </span>
        </div>

        {shown.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-6 py-12 text-center text-muted-foreground">{users.length ? t.noMatch : t.empty}</p>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-xl border border-border bg-card lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr>
                    {[t.columns.email, t.columns.onboarding, t.columns.events, t.columns.answers].map((h) => (
                      <th key={h} scope="col" className="px-5 py-3 font-normal whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shown.map((u) => (
                    <tr key={u.id} className="align-top">
                      <td className="px-5 py-3.5">
                        <span className="grid gap-1">
                          <span className="flex flex-wrap items-center gap-2">
                            <a href={`mailto:${u.email}`} className="font-medium [overflow-wrap:anywhere] hover:text-primary">
                              {u.email}
                            </a>
                            {u.unlimited ? <Badge variant="outline">{t.unlimited}</Badge> : null}
                          </span>
                          <span className="text-xs text-muted-foreground tabular">
                            {t.columns.registered} {day(u.createdAt)} · {t.columns.lastSeen} {day(u.lastSignInAt)}
                          </span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="grid justify-items-start gap-1">
                          <Onboarding status={u.onboarding} />
                          <span className="text-xs text-muted-foreground">{details(u)}</span>
                        </span>
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap tabular">{fill(t.events, { events: u.events, published: u.published })}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap tabular">{fill(t.answers, { answers: u.answers, people: u.peopleComing })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="grid gap-3 lg:hidden">
              {shown.map((u) => (
                <li key={u.id} className="grid gap-3 rounded-xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <a href={`mailto:${u.email}`} className="min-w-0 font-medium [overflow-wrap:anywhere]">
                      {u.email}
                    </a>
                    {u.unlimited ? <Badge variant="outline">{t.unlimited}</Badge> : null}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <Fact label={t.columns.registered} value={day(u.createdAt)} />
                    <Fact label={t.columns.lastSeen} value={day(u.lastSignInAt)} />
                    <Fact label={t.columns.onboarding} value={<Onboarding status={u.onboarding} />} />
                    <Fact label={`${t.columns.city} · ${t.columns.planning}`} value={details(u)} />
                    <Fact label={t.columns.events} value={fill(t.events, { events: u.events, published: u.published })} />
                    <Fact label={t.columns.answers} value={fill(t.answers, { answers: u.answers, people: u.peopleComing })} />
                  </dl>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  );
}

function Onboarding({ status }: { status: AdminUser["onboarding"] }) {
  return <Badge variant={status === "done" ? "default" : status === "skipped" ? "secondary" : "outline"}>{t.onboarding[status]}</Badge>;
}

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular">{value}</dd>
    </div>
  );
}
