import { copy } from "@content/copy.ka";
import { Badge } from "@/components/ui/badge";
import type { AdminEvent, Results } from "@/lib/admin/results";
import { fill } from "@/lib/text";
import { TEMPLATES, isTemplateId } from "@/templates/registry";
import { formatLongDate } from "@/templates/shared/format";
import { Kpi, Panel } from "../admin-shell";
import { BarList } from "../charts";

const t = copy.admin.results;
const types = copy.events.types as Record<string, string>;

const eventDate = (e: AdminEvent) => (e.startsAt ? `${formatLongDate(e.startsAt.slice(0, 10))} · ${e.startsAt.slice(11, 16)}` : "·");

/** How much Brindo is used, and how guests answer: totals, the split, breakdowns, every event. */
export function ResultsView({ results: r, events }: { results: Results; events: AdminEvent[] }) {
  return (
    <>
      <section aria-label={t.heading} className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label={t.kpis.activeHosts} value={r.activeHosts} detail={fill(t.kpis.activeDetail, { n: r.hosts })} />
        <Kpi label={t.kpis.published} value={r.published} detail={fill(t.kpis.publishedDetail, { upcoming: r.upcoming, drafts: r.drafts, free: r.publishedFree })} />
        <Kpi label={t.kpis.answers} value={r.answers} detail={fill(t.kpis.answersDetail, { n: r.answersPerEvent })} />
        <Kpi label={t.kpis.people} value={r.peopleComing} detail={fill(t.kpis.peopleDetail, { n: r.averageParty })} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title={t.guests.title} lead={fill(t.guests.share, { p: r.comingShare })}>
          <Split coming={r.coming} notComing={r.notComing} />
        </Panel>
        <Panel title={t.byType}>
          <BarList rows={r.byType.map((row) => ({ label: types[row.key] ?? row.key, value: row.events }))} empty={t.empty} />
        </Panel>
        <Panel title={t.byTemplate}>
          <BarList
            rows={r.byTemplate.map((row) => ({ label: isTemplateId(row.key) ? TEMPLATES[row.key].displayName : row.key, value: row.events }))}
            empty={t.empty}
          />
        </Panel>
      </div>

      <Panel title={t.table.title} lead={t.table.lead}>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t.empty}</p>
        ) : (
          <>
            <div className="-mx-5 hidden overflow-x-auto sm:-mx-7 lg:block">
              <table className="w-full text-left text-sm">
                <thead className="border-y border-border text-muted-foreground">
                  <tr>
                    {[t.table.event, t.table.host, t.table.status, t.table.answers, t.table.coming, t.table.notComing, t.table.people].map((h, i) => (
                      <th key={h} scope="col" className={`px-4 py-3 font-normal whitespace-nowrap first:pl-7 last:pr-7 ${i >= 3 ? "text-right" : ""}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="py-3 pr-4 pl-7">
                        <span className="grid gap-0.5">
                          <span className="font-medium">{e.title ?? t.untitled}</span>
                          <span className="text-xs text-muted-foreground tabular">
                            {types[e.eventType] ?? e.eventType} · {eventDate(e)}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground [overflow-wrap:anywhere]">{e.email}</td>
                      <td className="px-4 py-3">
                        <Status event={e} />
                      </td>
                      <td className="px-4 py-3 text-right tabular">{e.answers}</td>
                      <td className="px-4 py-3 text-right tabular">{e.coming}</td>
                      <td className="px-4 py-3 text-right tabular">{e.notComing}</td>
                      <td className="py-3 pr-7 pl-4 text-right font-medium tabular">{e.peopleComing}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="grid divide-y divide-border lg:hidden">
              {events.map((e) => (
                <li key={e.id} className="grid gap-2 py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{e.title ?? t.untitled}</span>
                    <Status event={e} />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {types[e.eventType] ?? e.eventType} · {eventDate(e)}
                  </span>
                  <span className="text-sm text-muted-foreground [overflow-wrap:anywhere]">{e.email}</span>
                  <span className="text-sm tabular">
                    {t.table.answers} {e.answers} · {t.table.coming} {e.coming} · {t.table.notComing} {e.notComing} · {t.table.people} {e.peopleComing}
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </Panel>
    </>
  );
}

/** Coming and not coming as one bar, with both numbers as text. */
function Split({ coming, notComing }: { coming: number; notComing: number }) {
  const total = coming + notComing;
  return (
    <div className="grid gap-5">
      <div aria-hidden="true" className="flex h-2.5 overflow-hidden rounded-full bg-sunken">
        {total ? <div className="h-full bg-wine" style={{ width: `${(coming / total) * 100}%` }} /> : null}
      </div>
      <dl className="grid grid-cols-2 gap-4">
        <div className="grid gap-1">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden className="size-2 rounded-full bg-wine" />
            {t.guests.coming}
          </dt>
          <dd className="font-display text-[clamp(2rem,1.7rem+1.2vw,2.75rem)] leading-tight tabular">{coming}</dd>
        </div>
        <div className="grid gap-1">
          <dt className="flex items-center gap-2 text-sm text-muted-foreground">
            <span aria-hidden className="size-2 rounded-full bg-stroke" />
            {t.guests.notComing}
          </dt>
          <dd className="font-display text-[clamp(2rem,1.7rem+1.2vw,2.75rem)] leading-tight tabular">{notComing}</dd>
        </div>
      </dl>
    </div>
  );
}

function Status({ event }: { event: AdminEvent }) {
  if (event.status !== "published") return <Badge variant={event.status === "paid" ? "secondary" : "outline"}>{t.status[event.status]}</Badge>;
  return (
    <span className="grid justify-items-start gap-1">
      <Badge>{t.status.published}</Badge>
      {event.publishedFree ? <span className="text-xs text-muted-foreground">{t.status.free}</span> : null}
    </span>
  );
}
