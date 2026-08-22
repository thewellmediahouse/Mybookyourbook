import type { Metadata } from "next";
import { and, eq, isNotNull } from "drizzle-orm";
import { DeleteAccountForm } from "@/components/account/delete-form";
import { PageIntro } from "@/components/dashboard/page-intro";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { account } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Account" };

export default async function AccountSettingsPage() {
  const session = await requireUser();
  const db = await getDb();
  const [credential] = await db
    .select({ id: account.id })
    .from(account)
    .where(and(eq(account.userId, session.user.id), isNotNull(account.password)))
    .limit(1);
  const hasPassword = Boolean(credential);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="SETTINGS"
        title="Account"
        description="Download a copy of your studio details, or permanently close this account."
      />
      <div className="mt-10 flex flex-col gap-12">
        <section>
          <h2 className="font-display text-2xl text-foreground">Export my data</h2>
          <p className="mt-3 max-w-md text-sm text-muted">
            Downloads a JSON file with your profile, studios, commercials, and payment amounts. Video
            files are not included.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <a href="/api/account/export">Export my data</a>
            </Button>
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl text-foreground">Delete AI Identity</h2>
          <p className="mt-3 max-w-md text-sm text-muted">
            Identity removal lives on Your AI Identity, with a confirmation before anything is
            deleted.
          </p>
          <div className="mt-4">
            <Button asChild variant="outline">
              <a href="/dashboard/identity">Your AI Identity</a>
            </Button>
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl text-foreground">Delete account</h2>
          <p className="mt-3 max-w-md text-sm text-muted">
            This signs you out, removes your identity files, and closes studios you own if nobody
            else is on the team. Payment records are kept where the law requires.
          </p>
          <DeleteAccountForm hasPassword={hasPassword} />
        </section>
      </div>
    </main>
  );
}
