import { Spinner } from "@/components/ui/spinner";
import { TIMELINE, type TimelineId } from "@/lib/production/copy";

export function ProductionTimeline({
  state,
}: {
  state: Record<TimelineId, "complete" | "current" | "upcoming">;
}) {
  return (
    <ol className="mt-10 grid gap-4 sm:grid-cols-5">
      {TIMELINE.map((item) => {
        const status = state[item.id];
        return (
          <li key={item.id} className="rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center gap-2">
              {status === "current" ? <Spinner className="size-4" /> : null}
              <p className="text-xs font-medium tracking-[0.2em] text-accent">
                {status === "complete" ? "DONE" : status === "current" ? "NOW" : "NEXT"}
              </p>
            </div>
            <p className="mt-2 text-foreground">{item.label}</p>
          </li>
        );
      })}
    </ol>
  );
}
