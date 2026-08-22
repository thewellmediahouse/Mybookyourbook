import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
  description: "Choose a new Production30 password.",
};

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Choose a new password" description="This link can be used once.">
      <Suspense fallback={<p className="text-sm text-muted">Loading reset form…</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
