import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { copy } from "@content/copy.ka";
import { AdminHeading, AdminShell } from "../../../admin/admin-shell";
import { UsersView } from "../../../admin/users/users-view";
import { previewEnabled } from "../../samples";
import { SAMPLE_USERS } from "../lists";

export const metadata: Metadata = {
  title: "Admin users preview",
  robots: { index: false, follow: false, nocache: true },
};

/** /admin/users with fixed sample accounts, to check the layout without a database. */
export default function AdminUsersPreviewPage() {
  if (!previewEnabled) notFound();
  return (
    <AdminShell active="users" basePath="/preview/admin">
      <AdminHeading heading={copy.admin.users.heading} lead={copy.admin.users.lead} />
      <UsersView users={SAMPLE_USERS} />
    </AdminShell>
  );
}
