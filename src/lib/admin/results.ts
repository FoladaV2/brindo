/** /admin/users and /admin/results: the rows the admin functions return, and the totals made from them. */

export type AdminUser = {
  id: string;
  email: string;
  createdAt: string;
  lastSignInAt: string | null;
  onboarding: "done" | "skipped" | "none";
  /** Onboarding answers, when given: an option id ("tbilisi", "wedding"). */
  city: string | null;
  planning: string | null;
  events: number;
  published: number;
  answers: number;
  peopleComing: number;
  unlimited: boolean;
};

export type AdminEvent = {
  id: string;
  email: string;
  eventType: string;
  templateId: string;
  title: string | null;
  /** Tbilisi wall-clock time, YYYY-MM-DDTHH:MM. */
  startsAt: string | null;
  status: "draft" | "paid" | "published";
  publishedFree: boolean;
  createdAt: string;
  paidAt: string | null;
  answers: number;
  coming: number;
  notComing: number;
  peopleComing: number;
};

export type Results = {
  hosts: number;
  /** Made at least one invitation. */
  hostsWithEvents: number;
  /** Published at least one: the hosts who actually use Brindo. */
  activeHosts: number;
  events: number;
  drafts: number;
  published: number;
  publishedFree: number;
  /** Published and not yet happened (Tbilisi time). */
  upcoming: number;
  answers: number;
  coming: number;
  notComing: number;
  peopleComing: number;
  /** People per "coming" answer, one decimal. */
  averageParty: number;
  /** Answers per published invitation, one decimal. */
  answersPerEvent: number;
  /** Share of answers that are "coming", whole percent. */
  comingShare: number;
  byType: { key: string; events: number }[];
  byTemplate: { key: string; events: number }[];
};

const oneDecimal = (n: number) => Math.round(n * 10) / 10;

function countBy(events: AdminEvent[], key: (e: AdminEvent) => string) {
  const counts = new Map<string, number>();
  for (const e of events) counts.set(key(e), (counts.get(key(e)) ?? 0) + 1);
  return [...counts].map(([k, n]) => ({ key: k, events: n })).sort((a, b) => b.events - a.events);
}

/** Everything /admin/results shows, from the two lists. `now` is epoch ms. */
export function summarize(users: AdminUser[], events: AdminEvent[], now: number): Results {
  const live = events.filter((e) => e.status === "published");
  const tbilisiNow = new Date(now + 4 * 3600_000).toISOString().slice(0, 16);
  const sum = (list: AdminEvent[], pick: (e: AdminEvent) => number) => list.reduce((total, e) => total + pick(e), 0);

  const answers = sum(events, (e) => e.answers);
  const coming = sum(events, (e) => e.coming);
  const peopleComing = sum(events, (e) => e.peopleComing);

  return {
    hosts: users.length,
    hostsWithEvents: new Set(events.map((e) => e.email)).size,
    activeHosts: new Set(live.map((e) => e.email)).size,
    events: events.length,
    drafts: events.filter((e) => e.status === "draft").length,
    published: live.length,
    publishedFree: live.filter((e) => e.publishedFree).length,
    upcoming: live.filter((e) => e.startsAt !== null && e.startsAt >= tbilisiNow).length,
    answers,
    coming,
    notComing: sum(events, (e) => e.notComing),
    peopleComing,
    averageParty: coming ? oneDecimal(peopleComing / coming) : 0,
    answersPerEvent: live.length ? oneDecimal(answers / live.length) : 0,
    comingShare: answers ? Math.round((coming / answers) * 100) : 0,
    byType: countBy(events, (e) => e.eventType),
    byTemplate: countBy(events, (e) => e.templateId),
  };
}

/** The Tbilisi calendar day of a timestamp, YYYY-MM-DD (for formatLongDate). */
export const tbilisiDay = (iso: string) => new Date(Date.parse(iso) + 4 * 3600_000).toISOString().slice(0, 10);
