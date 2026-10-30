import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@content/copy.ka";
import { currentAdmin, requireAdmin } from "@/lib/admin/access";
import { loadAdminUsers } from "@/lib/admin/people";
import { AdminHeading, AdminShell, Unavailable } from "../admin-shell";
import { UsersView } from "./users-view";

const t = copy.admin;

/** Admins only, checked here and in the page (see /admin): everyone else gets a real 404. */
export async function generateMetadata(): Promise<Metadata> {
  if (!(await currentAdmin())) notFound();
  return { title: t.users.title, robots: { index: false, follow: false, nocache: true } };
}

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Users />
    </Suspense>
  );
}

async function Users() {
  await requireAdmin();
  const users = await loadAdminUsers();
  return (
    <AdminShell active="users">
      <AdminHeading heading={t.users.heading} lead={t.users.lead} />
      {users ? <UsersView users={users} /> : <Unavailable heading={t.unavailableLists.heading} body={t.unavailableLists.body} />}
    </AdminShell>
  );
}
