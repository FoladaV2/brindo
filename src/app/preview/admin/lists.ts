import type { AdminEvent, AdminUser } from "@/lib/admin/results";

/** Fixed sample accounts and events for /preview/admin/users and /results. Not real data. */
const EMAILS = ["nino.beridze@example.com", "giorgi.lomidze@example.com", "planner@example.com", "mariam.jashi@example.com", "levan@example.com", "tamar.ts@example.com"];

export const SAMPLE_USERS: AdminUser[] = EMAILS.map((email, i) => ({
  id: `00000000-0000-4000-8000-00000000000${i}`,
  email,
  createdAt: new Date(Date.UTC(2027, 4, 20 - i * 3, 9 + i)).toISOString(),
  lastSignInAt: i === 5 ? null : new Date(Date.UTC(2027, 4, 28 - i, 18)).toISOString(),
  onboarding: (["done", "done", "skipped", "done", "none", "done"] as const)[i],
  city: ["tbilisi", "batumi", null, "tbilisi", null, "kutaisi"][i],
  planning: ["wedding", "birthday", null, "christening", null, "wedding"][i],
  events: [2, 1, 6, 1, 0, 1][i],
  published: [1, 1, 4, 0, 0, 1][i],
  answers: [64, 21, 212, 0, 0, 38][i],
  peopleComing: [186, 48, 590, 0, 0, 97][i],
  unlimited: i === 2,
}));

const event = (i: number, over: Partial<AdminEvent>): AdminEvent => ({
  id: `10000000-0000-4000-8000-00000000000${i}`,
  email: EMAILS[0],
  eventType: "wedding",
  templateId: "lumiere",
  title: null,
  startsAt: null,
  status: "published",
  publishedFree: false,
  createdAt: new Date(Date.UTC(2027, 4, 25 - i)).toISOString(),
  paidAt: new Date(Date.UTC(2027, 4, 25 - i)).toISOString(),
  answers: 0,
  coming: 0,
  notComing: 0,
  peopleComing: 0,
  ...over,
});

export const SAMPLE_EVENTS: AdminEvent[] = [
  event(0, { title: "ნინო & გიორგი", startsAt: "2027-06-12T17:00", answers: 64, coming: 58, notComing: 6, peopleComing: 186 }),
  event(1, { email: EMAILS[1], eventType: "birthday", templateId: "noir", title: "ანას 30", startsAt: "2027-07-17T20:00", answers: 21, coming: 18, notComing: 3, peopleComing: 48 }),
  event(2, { email: EMAILS[2], eventType: "corporate", templateId: "noir", title: "TBC-ის საახალწლო ვახშამი", startsAt: "2027-12-24T19:00", publishedFree: true, answers: 140, coming: 121, notComing: 19, peopleComing: 380 }),
  event(3, { email: EMAILS[2], eventType: "christening", title: "ლუკას ნათლობა", startsAt: "2027-05-10T13:00", publishedFree: true, answers: 72, coming: 66, notComing: 6, peopleComing: 210 }),
  event(4, { email: EMAILS[3], eventType: "christening", status: "draft", paidAt: null, title: "მარიამის ნათლობა" }),
  event(5, { email: EMAILS[5], title: "თამარ & დავით", startsAt: "2027-09-04T19:00", answers: 38, coming: 33, notComing: 5, peopleComing: 97 }),
  event(6, { email: EMAILS[0], eventType: "engagement", status: "draft", paidAt: null }),
];
