import { copy } from "@content/copy.ka";
import { dateParts } from "@/lib/invitations/datetime";
import type { InvitationContent } from "@/lib/invitations/schema";

const t = copy.invitation;

/** Georgian date words for a Tbilisi wall-clock date: "შაბათი", "12", "ივნისი", "2027", "17:00". */
export function formatDate(local: string) {
  const p = dateParts(local);
  return {
    weekday: t.weekdays[p.weekday],
    day: String(p.day),
    month: t.months[p.month - 1],
    year: String(p.year),
    time: p.time,
  };
}

/** "12 ივნისი 2027" */
export function formatLongDate(local: string) {
  const d = formatDate(local);
  return `${d.day} ${d.month} ${d.year}`;
}

/** Calendar entry title: "ქორწილი · ნინო & გიორგი" */
export function calendarTitle(content: InvitationContent) {
  return `${t.date.calendarTitle} · ${content.partners[0]} ${t.ampersand} ${content.partners[1]}`;
}
