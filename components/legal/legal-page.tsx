import type { ReactNode } from "react";
import { PublicShell } from "@/components/site/public-shell";

export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <PublicShell>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 pb-24">
        <p className="rounded-2xl border border-accent/40 bg-surface px-4 py-3 text-sm text-accent-ink">
          Requires professional legal review before launch. This is a working copy, not legal advice,
          and is not attorney-reviewed.
        </p>
        <h1 className="mt-8 font-display text-4xl tracking-tight text-foreground">{title}</h1>
        {updated ? <p className="mt-3 text-sm text-muted">Last updated {updated}</p> : null}
        <div className="mt-8 space-y-4 leading-7 text-muted">{children}</div>
      </main>
    </PublicShell>
  );
}

export function LegalH2({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 font-display text-2xl text-foreground">{children}</h2>;
}

export function LegalH3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-lg font-semibold text-foreground">{children}</h3>;
}
