import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";
import { googleAuthEnabled } from "@/lib/auth";
import { safeInviteNext } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Create an account",
  description: "Create a Production30 account to produce a 30-second business commercial starring you.",
};

export const dynamic = "force-dynamic";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeInviteNext((await searchParams).next);
  return (
    <AuthShell
      title="Create your account"
      description="We'll email you a confirmation link. You must open that link before you can sign in."
    >
      <SignupForm googleEnabled={await googleAuthEnabled()} next={next} />
    </AuthShell>
  );
}
