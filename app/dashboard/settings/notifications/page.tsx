import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageIntro } from "@/components/dashboard/page-intro";
import { NotificationPreferencesForm } from "@/components/dashboard/notification-preferences";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";

export const metadata: Metadata = { title: "Notification settings" };

export default async function NotificationSettingsPage() {
  const session = await requireUser();
  const db = await getDb();
  const [profile] = await db
    .select({ emailProductUpdates: profiles.emailProductUpdates })
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="SETTINGS"
        title="Notification preferences"
        description="Transactional notices stay on. Product updates are optional."
      />
      <NotificationPreferencesForm productUpdates={Boolean(profile?.emailProductUpdates)} />
    </main>
  );
}
