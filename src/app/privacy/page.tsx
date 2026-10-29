import type { Metadata } from "next";
import { copy } from "@content/copy.ka";
import { LegalPage } from "@/components/marketing/legal-page";

export const metadata: Metadata = { title: copy.legal.privacy.title };

export default function PrivacyPage() {
  return <LegalPage content={copy.legal.privacy} />;
}
