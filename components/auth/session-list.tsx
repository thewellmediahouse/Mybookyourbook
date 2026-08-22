"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/auth-client";
import type { PublicSession } from "@/lib/auth/session-display";

export function SessionList({ sessions }: { sessions: PublicSession[] }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const hasOthers = sessions.some((session) => !session.isCurrent);

  async function signOutOthers() {
    setError(null);
    setPending(true);
    const { error: revokeError } = await authClient.revokeOtherSessions();
    setPending(false);
    if (revokeError) {
      setError("We couldn't sign out the other sessions. Try again.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <ul className="flex flex-col gap-3">
        {sessions.map((session) => (
          <li key={session.id} className="rounded-lg border border-border bg-surface p-4">
            <p className="font-medium text-foreground">
              {session.device}
              {session.isCurrent ? " · This device" : ""}
            </p>
            <p className="mt-1 text-sm text-muted">Last activity {session.lastActive}</p>
            <p className="text-sm text-muted">Signed in {session.signedIn}</p>
            {session.ipAddress ? (
              <p className="text-sm text-muted">Approximate location source: {session.ipAddress}</p>
            ) : null}
          </li>
        ))}
      </ul>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="button" variant="outline" disabled={!hasOthers} busy={pending} onClick={signOutOthers}>
        {pending ? "Signing out…" : "Sign Out Other Sessions"}
      </Button>
    </div>
  );
}
