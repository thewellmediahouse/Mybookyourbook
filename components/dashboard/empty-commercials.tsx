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
    <section className="mt-12 overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="border-b border-border bg-surface-secondary px-6 py-8 sm:px-10">
        <p className="text-[11px] font-semibold tracking-[0.22em] text-accent">AD STUDIO</p>
        <h2 className="mt-3 font-display text-3xl tracking-tight text-foreground">{EMPTY_HEADING}</h2>
        <p className="mt-4 max-w-2xl text-lg text-muted">{EMPTY_BODY}</p>
      </div>
      <ol className="grid gap-px bg-border sm:grid-cols-3">
        {EMPTY_STEPS.map((step, index) => (
          <li key={step} className="bg-surface px-6 py-6">
            <p className="flex size-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-accent-foreground">
              {index + 1}
            </p>
            <p className="mt-4 text-foreground">{step}</p>
          </li>
        ))}
      </ol>
      <div className="px-6 py-6 sm:px-10">
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
