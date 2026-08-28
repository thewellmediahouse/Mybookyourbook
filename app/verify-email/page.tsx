import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResendVerificationForm } from "@/components/auth/resend-verification-form";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { emailSendingEnabled } from "@/lib/auth";
import { verifyEmailPageCopy } from "@/lib/auth/verify-email-copy";
import { safeInviteNext } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Thank you",
  description: "Check your email to confirm your Production30 account.",
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
  const copy = verifyEmailPageCopy({ mailReady, email });
  return (
    <AuthShell title={copy.title} description={copy.description}>
      {mailReady ? (
        <ResendVerificationForm next={next} email={email} />
      ) : (
        <DisabledAction
          className="mt-8"
          label="Send the message again"
          reason="Email sending is not connected yet."
        />
      )}
    </AuthShell>
  );
}
