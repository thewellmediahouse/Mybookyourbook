"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ADMIN_NAV } from "@/lib/admin/nav";

export function AdminNav() {
  const pathname = usePathname();
  const search = useSearchParams();
  const status = search.get("status");

  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
      {ADMIN_NAV.map((item) => {
        let isActive = false;
        if (item.href === "/admin") {
          isActive = pathname === "/admin";
        } else if (item.href === "/admin/jobs?status=FAILED") {
          isActive = pathname === "/admin/jobs" && status === "FAILED";
        } else if (item.href === "/admin/jobs") {
          isActive = pathname === "/admin/jobs" && status !== "FAILED";
        } else {
          isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        }
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`inline-flex min-h-11 items-center rounded-md px-3 text-sm transition-colors ${
              isActive ? "bg-surface text-foreground" : "text-muted hover:bg-surface hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
