"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DESKTOP_NAV, MOBILE_NAV, navItemActive } from "@/lib/dashboard/nav";

export function DashboardDesktopNav({
  unreadCount,
  creditBalance,
}: {
  unreadCount: number;
  creditBalance: number;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Studio" className="flex flex-1 flex-col gap-1">
      {DESKTOP_NAV.map((item) => {
        const active = navItemActive(pathname, item.href, item.exact);
        const showUnread = item.href === "/dashboard/notifications" && unreadCount > 0;
        const showCredits = item.href === "/dashboard/credits";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-11 items-center justify-between rounded-md px-3 text-sm transition-colors",
              active
                ? "bg-surface text-foreground"
                : "text-muted hover:bg-surface hover:text-foreground",
            )}
          >
            <span>{item.label}</span>
            {showCredits ? (
              <span className="tabular-nums text-foreground">{creditBalance}</span>
            ) : null}
            {showUnread ? (
              <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">
                {unreadCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardMobileNav({ creditBalance }: { creditBalance: number }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Studio mobile"
      className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-5 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {MOBILE_NAV.map((item) => {
        const active = navItemActive(pathname, item.href, item.exact);
        const showCredits = item.href === "/dashboard/credits";
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "inline-flex min-h-14 flex-col items-center justify-center px-1 text-center text-xs",
              active ? "text-foreground" : "text-muted",
            )}
          >
            {item.label}
            {showCredits ? <span className="tabular-nums text-foreground">{creditBalance}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
