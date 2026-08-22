import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { SiteLogo } from "@/components/brand/site-logo";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { AdminNav } from "@/components/admin/admin-nav";

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 bg-background">
      <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border px-4 py-6 lg:flex">
        <Link href="/admin" aria-label="Production30 staff">
          <SiteLogo priority className="h-10 w-auto" />
        </Link>
        <p className="mt-3 text-xs tracking-[0.18em] text-accent">STAFF</p>
        <div className="mt-6 flex-1 overflow-y-auto">
          <Suspense fallback={<p className="px-3 text-sm text-muted">Menu</p>}>
            <AdminNav />
          </Suspense>
        </div>
        <div className="mt-6 border-t border-border pt-4">
          <Link href="/dashboard" className="inline-flex min-h-11 items-center px-3 text-sm text-muted">
            Back to studio
          </Link>
          <SignOutButton className="justify-start" />
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="border-b border-border px-4 py-3 lg:hidden">
          <Link href="/admin" className="text-sm text-foreground">
            Staff
          </Link>
        </header>
        {children}
      </div>
    </div>
  );
}
