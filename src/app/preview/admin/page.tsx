import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { AdminStats } from "@/lib/admin/stats";
import { AdminView } from "../../admin/admin-view";
import { previewEnabled } from "../samples";

export const metadata: Metadata = {
  title: "Admin preview",
  robots: { index: false, follow: false, nocache: true },
};

/** Fixed sample numbers, to check the admin layout without a database. Not real data. */
const DAILY = [12, 18, 9, 24, 31, 27, 40, 22, 19, 35, 44, 38, 29, 51, 47, 33, 28, 39, 56, 61, 42, 37, 48, 55, 63, 58, 44, 49, 71, 66];

const SAMPLE: AdminStats = {
  days: 30,
  visitors: 1046,
  views: 2318,
  daily: DAILY.map((visitors, i) => ({
    day: new Date(Date.UTC(2027, 4, 1 + i)).toISOString().slice(0, 10),
    visitors,
    views: Math.round(visitors * 2.2),
  })),
  pages: [
    { label: "/", views: 1210, visitors: 890 },
    { label: "/i/:slug", views: 640, visitors: 512 },
    { label: "/register", views: 220, visitors: 184 },
    { label: "/login", views: 96, visitors: 71 },
    { label: "/dashboard", views: 152, visitors: 58 },
  ],
  referrers: [
    { label: "", views: 980, visitors: 610 },
    { label: "instagram.com", views: 520, visitors: 240 },
    { label: "facebook.com", views: 310, visitors: 130 },
    { label: "google.com", views: 140, visitors: 66 },
  ],
  devices: [
    { label: "mobile", views: 1810, visitors: 860 },
    { label: "desktop", views: 460, visitors: 170 },
    { label: "tablet", views: 48, visitors: 16 },
  ],
  funnel: [
    { key: "visited", count: 1046 },
    { key: "registerPage", count: 184 },
    { key: "registered", count: 92 },
    { key: "onboarded", count: 71 },
    { key: "createdEvent", count: 64 },
    { key: "published", count: 23 },
    { key: "gotAnswer", count: 21 },
  ],
  onboardingSkipped: 14,
  startedPayment: 29,
  totals: { eventsCreated: 70, publishedPaid: 19, publishedFree: 4, revenueMinor: 93100, answers: 812, peopleComing: 2140 },
  onboarding: [
    { question: "eventType", answer: "wedding", hosts: 31 },
    { question: "eventType", answer: "birthday", hosts: 22 },
    { question: "eventType", answer: "christening", hosts: 9 },
    { question: "eventType", answer: "corporate", hosts: 6 },
    { question: "source", answer: "instagram", hosts: 28 },
    { question: "source", answer: "friend", hosts: 19 },
    { question: "source", answer: "invitation", hosts: 14 },
    { question: "source", answer: "facebook", hosts: 10 },
  ],
  entitlements: [{ userId: "00000000-0000-4000-8000-000000000001", email: "planner@example.com", note: "ღონისძიებების დამგეგმავი", grantedAt: "2027-05-12T10:00:00Z" }],
};

export default function AdminPreviewPage() {
  if (!previewEnabled) notFound();
  return <AdminView days={30} stats={SAMPLE} basePath="/preview/admin" />;
}
