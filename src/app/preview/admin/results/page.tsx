import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@content/copy.ka";
import { summarize } from "@/lib/admin/results";
import { AdminHeading, AdminShell } from "../../../admin/admin-shell";
import { ResultsView } from "../../../admin/results/results-view";
import { previewEnabled } from "../../samples";
import { SAMPLE_EVENTS, SAMPLE_USERS } from "../lists";

export const metadata: Metadata = {
  title: "Admin results preview",
  robots: { index: false, follow: false, nocache: true },
};

/** /admin/results with fixed sample events, to check the layout without a database. */
export default function AdminResultsPreviewPage() {
  if (!previewEnabled) notFound();
  // A fixed "now", so the sample's upcoming and past events stay the same.
  const results = summarize(SAMPLE_USERS, SAMPLE_EVENTS, Date.UTC(2027, 5, 1));
  return (
    <AdminShell active="results" basePath="/preview/admin">
      <AdminHeading heading={copy.admin.results.heading} lead={copy.admin.results.lead} />
      <ResultsView results={results} events={SAMPLE_EVENTS} />
    </AdminShell>
  );
}
