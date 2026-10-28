import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { copy } from "@content/copy.ka";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { DashboardShell } from "../../shell";
import { CreateForm } from "./create-form";

const t = copy.create;

export const metadata: Metadata = {
  title: t.title,
  robots: { index: false, follow: false },
};

export default function NewInvitationPage() {
  return (
    <DashboardShell>
      <section className="mx-auto flex max-w-[34rem] flex-col px-gutter pt-8 pb-section sm:pt-16">
        <Link href="/dashboard" className="inline-flex min-h-tap items-center gap-2 self-start text-small text-fg-muted hover:text-fg">
          <ArrowLeft size={16} strokeWidth={1.25} aria-hidden />
          {t.back}
        </Link>
        <SectionHeader as="h1" align="start" label={t.label} title={t.heading} className="mt-10" />
        <p className="mt-6 text-body text-fg-muted">{t.lead}</p>
        <CreateForm />
      </section>
    </DashboardShell>
  );
}
