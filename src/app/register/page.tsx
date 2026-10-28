import type { Metadata } from "next";
import { copy } from "@content/copy.ka";
import { AuthShell } from "@/components/AuthShell";
import { RegisterPanel } from "./register-panel";

export const metadata: Metadata = {
  title: copy.auth.register.title,
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return (
    <AuthShell>
      <RegisterPanel />
    </AuthShell>
  );
}
