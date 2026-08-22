import type { ReactNode } from "react";
import { PublicShell } from "@/components/site/public-shell";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <PublicShell>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <p className="rounded-2xl border border-accent/40 bg-surface px-4 py-3 text-sm text-accent">
          Requires professional legal review before launch.
        </p>
        <h1 className="mt-8 font-display text-4xl tracking-tight text-foreground">{title}</h1>
        <div className="mt-8 space-y-4 leading-7 text-muted">{children}</div>
      </main>
    </PublicShell>
  );
}
