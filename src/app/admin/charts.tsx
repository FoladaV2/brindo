import { copy } from "@content/copy.ka";
import type { FunnelStep } from "@/lib/admin/stats";
import { fill } from "@/lib/text";
import { formatLongDate } from "@/templates/shared/format";

const t = copy.admin;

/*
 * Small, single-series charts for /admin (DESIGN.md colors, the dataviz rules): one hue (wine) for
 * marks, text in text colors, thin bars with 4px rounded data ends and 2px gaps, recessive axes, a
 * tooltip on every mark, and the numbers as text or a table, so nothing depends on color alone.
 */

const shortDate = (day: string) => formatLongDate(`${day}T12:00`).split(" ").slice(0, 2).join(" ");

/** Visitors per day as columns, with each day's numbers on hover and in a table for screen readers. */
export function DailyBars({ daily }: { daily: { day: string; visitors: number; views: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.visitors));
  return (
    <figure className="grid gap-3">
      <div className="flex items-baseline justify-between text-xs text-muted-foreground tabular" aria-hidden="true">
        <span>{max}</span>
      </div>
      <div aria-hidden="true" className="flex h-44 items-end gap-0.5 border-b border-border">
        {daily.map((d) => (
          <div key={d.day} className="group/bar relative flex h-full min-w-0 flex-1 items-end">
            <div
              className="w-full rounded-t-[4px] bg-wine group-hover/bar:bg-wine-press"
              style={{ height: `${Math.max(d.visitors > 0 ? 2 : 0, (d.visitors / max) * 100)}%` }}
            />
            <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 rounded-sm bg-onyx px-2.5 py-1.5 text-xs whitespace-nowrap text-bone group-hover/bar:block">
              {fill(t.daily.tooltip, { date: shortDate(d.day), visitors: d.visitors, views: d.views })}
            </span>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground" aria-hidden="true">
        <span>{shortDate(daily[0]?.day ?? "")}</span>
        <span>{shortDate(daily[daily.length - 1]?.day ?? "")}</span>
      </div>
      <table className="sr-only">
        <caption>{t.daily.title}</caption>
        <thead>
          <tr>
            <th scope="col">{t.daily.day}</th>
            <th scope="col">{t.daily.visitors}</th>
            <th scope="col">{t.daily.views}</th>
          </tr>
        </thead>
        <tbody>
          {daily.map((d) => (
            <tr key={d.day}>
              <th scope="row">{shortDate(d.day)}</th>
              <td>{d.visitors}</td>
              <td>{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

/** Ranked rows: label and number as text, a thin bar for the proportion. */
export function BarList({ rows, empty }: { rows: { label: string; value: number }[]; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-3.5">
      {rows.map((row) => (
        <li key={row.label} className="grid gap-1.5" title={`${row.label}: ${row.value}`}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 truncate">{row.label}</span>
            <span className="shrink-0 font-medium tabular">{row.value}</span>
          </div>
          <div aria-hidden="true" className="h-1.5 rounded-full bg-sunken">
            <div className="h-full rounded-full bg-wine" style={{ width: `${(row.value / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Each step with its count, its share of the step before, and how many stopped there. */
export function Funnel({ steps }: { steps: FunnelStep[] }) {
  const top = Math.max(1, steps[0]?.count ?? 0);
  return (
    <ol className="grid gap-4">
      {steps.map((step, i) => {
        const previous = i > 0 ? steps[i - 1].count : null;
        const share = previous ? Math.round((step.count / previous) * 100) : null;
        const stopped = previous !== null ? Math.max(0, previous - step.count) : 0;
        const label = t.funnel.steps[step.key as keyof typeof t.funnel.steps];
        return (
          <li key={step.key} className="grid gap-2 sm:grid-cols-[13rem_minmax(0,1fr)] sm:items-center sm:gap-6">
            <div className="flex items-baseline justify-between gap-3 sm:block">
              <span className="text-sm font-medium">{label}</span>
              {share !== null ? (
                <span className="text-xs text-muted-foreground sm:block">{fill(t.funnel.ofPrevious, { p: share })}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-3" title={`${label}: ${step.count}`}>
              <div aria-hidden="true" className="h-8 min-w-0 flex-1 rounded-sm bg-sunken">
                <div className="h-full rounded-sm bg-wine" style={{ width: `${Math.max(step.count > 0 ? 1 : 0, (step.count / top) * 100)}%` }} />
              </div>
              <span className="w-14 shrink-0 text-right font-display text-lg tabular">{step.count}</span>
            </div>
            {stopped > 0 ? (
              <span className="text-xs text-muted-foreground sm:col-start-2">{fill(t.funnel.stopped, { n: stopped })}</span>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
