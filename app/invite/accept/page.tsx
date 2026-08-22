import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { AcceptInviteForm } from "@/components/team/accept-invite-form";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { normalizeEmail } from "@/lib/auth/password";
import {
  INVALID_INVITE,
  INVITE_WRONG_EMAIL,
  JOIN_STUDIO,
  roleLabel,
} from "@/lib/workspaces/copy";
import { peekInvitation } from "@/lib/workspaces/invite";

export const metadata: Metadata = {
  title: "Studio invitation",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token?.trim() ?? "";
  const db = await getDb();
  const preview = token ? await peekInvitation(db, token) : null;
  const session = await getSession();

  if (!preview || preview.expired || preview.accepted) {
    return (
      <AuthShell title="Invitation" description={INVALID_INVITE}>
        <p className="text-sm text-muted">
          Ask a studio owner or admin to send a new invitation if you still need access.
        </p>
      </AuthShell>
    );
  }

  const next = `/invite/accept?token=${token.toLowerCase()}`;
  const signedIn = Boolean(session);
  const emailMatches = session ? normalizeEmail(session.user.email) === preview.email : false;

  return (
    <AuthShell
      title={JOIN_STUDIO}
      description={`You've been invited to ${preview.workspaceName} as ${roleLabel(preview.role)}.`}
    >
      {signedIn && emailMatches ? (
        <AcceptInviteForm token={token.toLowerCase()} />
      ) : null}
      {signedIn && !emailMatches ? (
        <p className="text-sm text-danger">{INVITE_WRONG_EMAIL}</p>
      ) : null}
      {!signedIn ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-muted">{INVITE_WRONG_EMAIL}</p>
          <p className="text-sm text-muted">
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-foreground underline">
              Sign in
            </Link>
            {" · "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="text-foreground underline">
              Create an account
            </Link>
          </p>
        </div>
      ) : null}
    </AuthShell>
  );
}
