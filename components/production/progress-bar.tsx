import { productionProgressLabel, productionProgressPercent } from "@/lib/production/copy";

export function ProductionProgressBar({
  jobStatus,
}: {
  jobStatus: string | null;
}) {
  const percent = productionProgressPercent(jobStatus);
  const label = productionProgressLabel(jobStatus);
  return (
    <div className="mt-8 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="tabular-nums text-sm text-muted">{percent}%</p>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        aria-label={label}
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
