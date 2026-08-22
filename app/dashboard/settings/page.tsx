import type { Metadata } from "next";
import Link from "next/link";
import { PageIntro } from "@/components/dashboard/page-intro";

export const metadata: Metadata = { title: "Settings" };

const SETTINGS_LINKS = [
  { href: "/dashboard/settings/profile", label: "Profile", body: "Name, timezone, and country." },
  {
    href: "/dashboard/settings/security",
    label: "Security",
    body: "Password, sessions, and sign-out of other devices.",
  },
  {
    href: "/dashboard/settings/notifications",
    label: "Notifications",
    body: "Email preferences for this account.",
  },
  {
    href: "/dashboard/settings/account",
    label: "Account",
    body: "Export and deletion options.",
  },
] as const;

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro kicker="SETTINGS" title="Settings" description="Account controls for this login." />
      <ul className="mt-10 grid gap-3">
        {SETTINGS_LINKS.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="block rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent"
            >
              <p className="text-foreground">{item.label}</p>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
