import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { copy } from "@content/copy.ka";
import { Toasts } from "@/components/toasts";
import { createClient } from "@/lib/supabase/server";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = {
  title: copy.onboarding.title,
  robots: { index: false, follow: false },
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <Onboarding />
    </Suspense>
  );
}

/** Right after registration. Hosts who already answered (or skipped) go straight to the dashboard. */
async function Onboarding() {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (!claims?.claims.sub) redirect("/login");

  const { data: done } = await supabase.from("onboarding").select("user_id").maybeSingle();
  if (done) redirect("/dashboard");

  return (
    <>
      <OnboardingFlow />
      <Toasts />
    </>
  );
}
