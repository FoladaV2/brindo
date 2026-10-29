import type { Metadata } from "next";
import { copy } from "@content/copy.ka";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginPanel } from "./login-panel";

export const metadata: Metadata = {
  title: copy.auth.login.title,
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <AuthShell>
      <LoginPanel />
    </AuthShell>
  );
}
