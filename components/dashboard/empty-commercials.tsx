import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import {
  EMPTY_BODY,
  EMPTY_CTA,
  EMPTY_HEADING,
  EMPTY_STEPS,
} from "@/lib/dashboard/copy";

export function EmptyCommercials({
  canCreate,
  blockedReason,
}: {
  canCreate: boolean;
  blockedReason?: string;
}) {
  return (
    <section className="mt-12 rounded-lg border border-border bg-surface px-6 py-10">
      <h2 className="font-display text-3xl tracking-tight text-foreground">{EMPTY_HEADING}</h2>
      <p className="mt-4 max-w-2xl text-lg text-muted">{EMPTY_BODY}</p>
      <ol className="mt-8 grid gap-3 sm:grid-cols-3">
        {EMPTY_STEPS.map((step, index) => (
          <li key={step} className="rounded-md border border-border bg-surface-secondary p-4">
            <p className="text-xs font-medium tracking-[0.2em] text-accent">{index + 1}</p>
            <p className="mt-2 text-foreground">{step}</p>
          </li>
        ))}
      </ol>
      <div className="mt-8">
        {canCreate ? (
          <Button asChild>
            <Link href="/dashboard/create">{EMPTY_CTA}</Link>
          </Button>
        ) : (
          <DisabledAction label={EMPTY_CTA} reason={blockedReason ?? ""} />
        )}
      </div>
    </section>
  );
}
