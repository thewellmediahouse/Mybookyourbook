import type { Metadata } from "next";
import { headers } from "next/headers";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { SessionList } from "@/components/auth/session-list";
import { PageIntro } from "@/components/dashboard/page-intro";
import { getAuth, requireUser } from "@/lib/auth";
import { describeUserAgent, formatSessionTime, type PublicSession } from "@/lib/auth/session-display";

export const metadata: Metadata = { title: "Security" };

export default async function SecuritySettingsPage() {
  const current = await requireUser();
  const auth = await getAuth();
  const sessions = await auth.api.listSessions({
    headers: await headers(),
  });

  const publicSessions: PublicSession[] = (sessions ?? []).map((item) => ({
    id: item.id,
    isCurrent: item.id === current.session.id,
    device: describeUserAgent(item.userAgent),
    ipAddress: item.ipAddress ?? null,
    lastActive: formatSessionTime(item.updatedAt),
    signedIn: formatSessionTime(item.createdAt),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="SECURITY"
        title="Sign-in and sessions"
        description={`Signed in as ${current.user.email}. Password changes and session sign-out apply to this account only.`}
      />

      <section className="mt-12">
        <h2 className="font-display text-2xl text-foreground">Password</h2>
        <div className="mt-4">
          <ChangePasswordForm />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-foreground">Two-step verification</h2>
        <p className="mt-3 text-muted">
          Two-step verification will use Better Auth for studio owners and admins. Custom one-time
          codes are not used. This control is not available yet.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-foreground">Connected accounts</h2>
        <p className="mt-3 text-muted">
          Email and password is enabled. Google sign-in appears on login only when both Google
          environment values are configured.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl text-foreground">Active sessions</h2>
        <p className="mt-3 text-muted">
          Device details are approximate, from the browser that created each session.
        </p>
        <div className="mt-6">
          <SessionList sessions={publicSessions} />
        </div>
      </section>
    </main>
  );
}
