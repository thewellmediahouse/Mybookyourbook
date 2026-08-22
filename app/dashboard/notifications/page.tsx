import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";
import { formatStudioDate } from "@/lib/dashboard/format";
import { requireStudio } from "@/lib/dashboard/studio";
import { listWorkspaceNotifications } from "@/lib/dashboard/summary";
import { markWorkspaceNotificationsRead } from "@/lib/notifications/in-app";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const studio = await requireStudio();
  const items = await listWorkspaceNotifications(
    studio.db,
    studio.userId,
    studio.active.workspaceId,
  );
  await markWorkspaceNotificationsRead(studio.db, studio.userId, studio.active.workspaceId);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="UPDATES"
        title="Notifications"
        description="Production, credit, and billing notices for this studio."
      />
      {items.length === 0 ? (
        <p className="mt-10 rounded-lg border border-border bg-surface p-6 text-muted">
          You have no notifications in this studio.
        </p>
      ) : (
        <ul className="mt-10 divide-y divide-border rounded-lg border border-border bg-surface">
          {items.map((item) => (
            <li key={item.id} className="px-5 py-4">
              {item.actionUrl ? (
                <Link href={item.actionUrl} className="text-foreground hover:text-accent">
                  {item.title}
                </Link>
              ) : (
                <p className="text-foreground">{item.title}</p>
              )}
              <p className="mt-1 text-sm text-muted">{item.body}</p>
              <p className="mt-2 text-sm text-muted">
                {formatStudioDate(item.createdAt)}
                {item.readAt ? "" : " · New"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
