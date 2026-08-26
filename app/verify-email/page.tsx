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
  searchParams: Promise<{ next?: string; email?: string }>;
}) {
  const params = await searchParams;
  const next = safeInviteNext(params.next);
  const email = params.email?.includes("@") ? params.email.trim().slice(0, 254) : null;
  const mailReady = await emailSendingEnabled();
  return (
    <AuthShell
      title="Confirm your email"
      description={
        mailReady
          ? "You have an account, but it is not open yet. Check your inbox for a Production30 message, then open the link. You cannot sign in until you do."
          : "Your account was created. Email sending is not connected yet, so we cannot send a confirmation message. You will not receive anything in your inbox until that is set up."
      }
    >
      {mailReady ? (
        <ResendVerificationForm next={next} email={email} />
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
