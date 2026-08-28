import Link from "next/link";
import { COMMERCIALS_HEADING } from "@/lib/dashboard/copy";
import { formatCommercialFormat, formatDurationSeconds, formatStudioDate } from "@/lib/dashboard/format";
import type { CommercialListItem } from "@/lib/dashboard/summary";
import { isCreateWizardStatus, isInProductionStatus, projectStatusLabel } from "@/lib/projects/status";

export function CommercialList({
  items,
  heading = true,
}: {
  items: CommercialListItem[];
  heading?: boolean;
}) {
  return (
    <section className="mt-12">
      {heading ? (
        <h2 className="font-display text-2xl text-foreground">{COMMERCIALS_HEADING}</h2>
      ) : null}
      <ul className={heading ? "mt-6 grid gap-4" : "grid gap-4"}>
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={
                isCreateWizardStatus(item.status)
                  ? `/dashboard/create?project=${item.id}`
                  : isInProductionStatus(item.status)
                    ? `/dashboard/commercials/${item.id}/production`
                    : `/dashboard/commercials/${item.id}`
              }
              className="flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-accent sm:flex-row sm:items-center"
            >
              <div className="h-28 w-full overflow-hidden rounded-md bg-surface-secondary sm:h-20 sm:w-36 sm:shrink-0">
                {item.thumbnailAssetId ? (
                  // Authenticated studio stream; not a public CDN image.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`/api/assets/${item.thumbnailAssetId}`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted">
                    No preview yet
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg text-foreground">{item.title}</p>
                <p className="mt-1 text-sm text-muted">{item.businessName}</p>
                <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
                  <span>{projectStatusLabel(item.status)}</span>
                  <span>{formatStudioDate(item.updatedAt)}</span>
                  <span>{formatCommercialFormat(item)}</span>
                  <span>{formatDurationSeconds(item.duration)}</span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
