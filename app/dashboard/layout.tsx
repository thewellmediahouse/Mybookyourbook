import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireStudio } from "@/lib/dashboard/studio";
import { getWalletBalance } from "@/lib/credits/ledger";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false },
};

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const studio = await requireStudio();
  const creditBalance = await getWalletBalance(studio.db, studio.active.workspaceId);

  return (
    <DashboardShell
      workspaces={studio.workspaces}
      activeId={studio.active.workspaceId}
      brands={studio.active.businesses}
      activeBrandId={studio.activeBrandId}
      creditBalance={creditBalance}
    >
      {children}
    </DashboardShell>
  );
}
