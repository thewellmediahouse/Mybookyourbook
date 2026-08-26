import Link from "next/link";
import { SiteLogo } from "@/components/brand/site-logo";
import { PublicFrame } from "./public-frame";

const columns = [
  {
    title: "Studio",
    links: [
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/examples", label: "Examples" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create an account" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/acceptable-use", label: "Acceptable use" },
    ],
  },
];

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <PublicFrame className="grid gap-10 py-16 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <span className="inline-flex rounded-xl bg-overlay-text px-2 py-1">
            <SiteLogo size="sm" className="h-10 w-auto" />
          </span>
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Your business, starring you. Professional 30-second commercials without a film crew.
          </p>
        </div>
        {columns.map((column) => (
          <div key={column.title}>
            <p className="text-sm font-semibold text-foreground">{column.title}</p>
            <nav aria-label={column.title} className="mt-4 flex flex-col gap-1">
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex min-h-10 items-center text-sm text-muted hover:text-foreground"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </PublicFrame>
    </footer>
  );
}
