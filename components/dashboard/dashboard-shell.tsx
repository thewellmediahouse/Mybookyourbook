import Link from "next/link";
import type { ReactNode } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import {
  DashboardDesktopNav,
  DashboardMobileNav,
} from "@/components/dashboard/dashboard-nav";
import { BrandSwitcher } from "@/components/workspace/brand-switcher";
import { WorkspaceSwitcher } from "@/components/workspace/workspace-switcher";
import type { WorkspaceListItem } from "@/lib/workspaces/queries";

export function DashboardShell({
  children,
  workspaces,
  activeId,
  brands,
  activeBrandId,
  unreadCount,
  creditBalance,
}: {
  children: ReactNode;
  workspaces: WorkspaceListItem[];
  activeId: string;
  brands: { id: string; name: string }[];
  activeBrandId: string | null;
  unreadCount: number;
  creditBalance: number;
}) {
  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border px-4 py-6 lg:flex">
        <Link href="/dashboard" aria-label="Production30 studio">
          <SiteLogo priority className="h-10 w-auto" />
        </Link>
        {workspaces.length > 1 || brands.length > 1 ? (
          <div className="mt-6 flex flex-col gap-3">
            <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} />
            <BrandSwitcher brands={brands} activeId={activeBrandId} />
          </div>
        ) : null}
        <div className="mt-6 flex-1 overflow-y-auto">
          <DashboardDesktopNav unreadCount={unreadCount} creditBalance={creditBalance} />
        </div>
        <div className="mt-6 flex flex-col gap-2 border-t border-border pt-4">
          <Link
            href="/dashboard/settings/profile"
            className="inline-flex min-h-11 items-center rounded-md px-3 text-sm text-muted transition-colors hover:bg-surface hover:text-foreground"
          >
            Profile
          </Link>
          <SignOutButton className="justify-start" />
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col pb-20 lg:pb-0">
        <header className="flex flex-col gap-3 border-b border-border px-4 py-3 lg:hidden">
          <div className="flex items-center justify-between gap-4">
            <Link href="/dashboard" aria-label="Production30 studio">
              <SiteLogo className="h-9 w-auto" />
            </Link>
          </div>
          {workspaces.length > 1 || brands.length > 1 ? (
            <div className="flex flex-col gap-2 sm:flex-row">
              <WorkspaceSwitcher workspaces={workspaces} activeId={activeId} />
              <BrandSwitcher brands={brands} activeId={activeBrandId} />
            </div>
          ) : null}
        </header>
        <div className="flex-1">{children}</div>
        <DashboardMobileNav creditBalance={creditBalance} />
      </div>
    </div>
  );
}
