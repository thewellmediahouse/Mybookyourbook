import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { emailSendingEnabled } from "@/lib/auth";
import { safeInviteNext } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Confirm your email to open your Production30 studio.",
};

export const dynamic = "force-dynamic";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeInviteNext((await searchParams).next);
  const mailReady = await emailSendingEnabled();
  return (
    <AuthShell
      title="Confirm your email"
      description={
        mailReady
          ? "Check your inbox for a Production30 message, then open the link to start your studio."
          : "Your account was created. Email sending is not connected yet, so we cannot send a confirmation message. You will not receive anything in your inbox until that is set up."
      }
    >
      {mailReady ? (
        <ResendVerificationForm next={next} />
      ) : (
        <DisabledAction
          className="mt-8"
          label="Resend verification email"
          reason="Email sending is not connected yet."
        />
      )}
    </AuthShell>
  );
}
