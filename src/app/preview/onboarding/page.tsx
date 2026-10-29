import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { OnboardingFlow } from "../../onboarding/onboarding-flow";
import { previewEnabled } from "../samples";

export const metadata: Metadata = {
  title: "Onboarding preview",
  robots: { index: false, follow: false, nocache: true },
};

/** The onboarding flow without an account or a database: answers are not saved. */
export default function OnboardingPreviewPage() {
  if (!previewEnabled) notFound();
  return <OnboardingFlow demo />;
}
