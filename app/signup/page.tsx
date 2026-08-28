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
  searchParams: Promise<{ next?: string; intent?: string }>;
}) {
  const params = await searchParams;
  const next = safeInviteNext(params.next);
  const description =
    params.intent === "viral"
      ? "We'll email you a confirmation link. After that, you can start a short social growth video starring you."
      : params.intent === "advert"
        ? "We'll email you a confirmation link. After that, you can start a sales advert starring you."
        : "We'll email you a confirmation link. You must open that link before you can sign in.";
  return (
    <AuthShell
      title="Create your account"
      description={description}
    >
      <SignupForm googleEnabled={await googleAuthEnabled()} next={next} />
    </AuthShell>
  );
}
