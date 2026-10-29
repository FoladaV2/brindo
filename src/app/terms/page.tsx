import type { Metadata } from "next";
import { copy } from "@content/copy.ka";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: copy.legal.terms.title };

export default function TermsPage() {
  return <LegalPage content={copy.legal.terms} />;
}
