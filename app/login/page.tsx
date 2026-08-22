import type { Metadata } from "next";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { googleAuthEnabled } from "@/lib/auth";
import { safeInviteNext } from "@/lib/auth/redirect";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Production30 to continue your commercial.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeInviteNext((await searchParams).next);
  return (
    <AuthShell title="Sign in" description="Welcome back. Continue producing your commercial.">
      <LoginForm googleEnabled={await googleAuthEnabled()} next={next} />
    </AuthShell>
  );
}
