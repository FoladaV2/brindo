import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@content/copy.ka";
import { currentAdmin, requireAdmin } from "@/lib/admin/access";
import { loadAdminStats, parsePeriod } from "@/lib/admin/stats";
import { AdminView } from "./admin-view";

/**
 * Admins only (ADMIN_EMAILS). The check runs here as well as in the page: metadata blocks before the
 * response starts (htmlLimitedBots in next.config.ts), so everyone else gets a real 404 status.
 */
export async function generateMetadata(): Promise<Metadata> {
  if (!(await currentAdmin())) notFound();
  return { title: copy.admin.title, robots: { index: false, follow: false, nocache: true } };
}

export default function AdminPage({ searchParams }: PageProps<"/admin">) {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Admin query={searchParams} />
    </Suspense>
  );
}

async function Admin({ query }: { query: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const days = parsePeriod((await query).days);
  const stats = await loadAdminStats(days).catch((error) => {
    console.error("[admin] stats failed", error);
    return null;
  });
  return <AdminView days={days} stats={stats} />;
}
