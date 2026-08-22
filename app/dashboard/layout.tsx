import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireStudio } from "@/lib/dashboard/studio";
import { getUnreadNotificationCount } from "@/lib/dashboard/summary";
import { getWalletBalance } from "@/lib/credits/ledger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const studio = await requireStudio();
  const [unreadCount, creditBalance] = await Promise.all([
    getUnreadNotificationCount(studio.db, studio.userId, studio.active.workspaceId),
    getWalletBalance(studio.db, studio.active.workspaceId),
  ]);

  return (
    <DashboardShell
      workspaces={studio.workspaces}
      activeId={studio.active.workspaceId}
      brands={studio.active.businesses}
      activeBrandId={studio.activeBrandId}
      unreadCount={unreadCount}
      creditBalance={creditBalance}
    >
      {children}
    </DashboardShell>
  );
}
