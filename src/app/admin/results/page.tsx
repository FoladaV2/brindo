import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { copy } from "@content/copy.ka";
import { currentAdmin, requireAdmin } from "@/lib/admin/access";
import { loadAdminEvents, loadAdminUsers } from "@/lib/admin/people";
import { summarize } from "@/lib/admin/results";
import { AdminHeading, AdminShell, Unavailable } from "../admin-shell";
import { ResultsView } from "./results-view";

const t = copy.admin;

/** Admins only, checked here and in the page (see /admin): everyone else gets a real 404. */
export async function generateMetadata(): Promise<Metadata> {
  if (!(await currentAdmin())) notFound();
  return { title: t.results.title, robots: { index: false, follow: false, nocache: true } };
}

export default function AdminResultsPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Results />
    </Suspense>
  );
}

async function Results() {
  await requireAdmin();
  const data = await loadResults();
  return (
    <AdminShell active="results">
      <AdminHeading heading={t.results.heading} lead={t.results.lead} />
      {data ? <ResultsView results={data.results} events={data.events} /> : <Unavailable heading={t.unavailableLists.heading} body={t.unavailableLists.body} />}
    </AdminShell>
  );
}

/** Per request: which events are still ahead depends on today's date. */
async function loadResults() {
  await connection();
  const [users, events] = await Promise.all([loadAdminUsers(), loadAdminEvents()]);
  return users && events ? { results: summarize(users, events, Date.now()), events } : null;
}
