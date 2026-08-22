import type { Metadata } from "next";
import Link from "next/link";
import { LibraryPanel } from "@/components/media/library-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { requireStudio } from "@/lib/dashboard/studio";
import { libraryWriteAvailability } from "@/lib/media/availability";
import { LIBRARY_BODY, LIBRARY_HEADING } from "@/lib/media/copy";
import { listLibraryAssets } from "@/lib/media/queries";
import { LIBRARY_TABS, parseLibraryTab } from "@/lib/media/slots";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const studio = await requireStudio();
  const tab = parseLibraryTab((await searchParams).tab);
  const brandId = studio.activeBrandId;
  const write = libraryWriteAvailability({
    role: studio.role,
    memberStatus: studio.memberStatus,
    brandId,
  });
  const items = brandId
    ? await listLibraryAssets(studio.db, {
        workspaceId: studio.active.workspaceId,
        businessId: brandId,
        role: tab.role,
      })
    : [];

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro kicker="LIBRARY" title={LIBRARY_HEADING} description={LIBRARY_BODY} />
      <nav className="mt-10 flex flex-wrap gap-2 border-b border-border" aria-label="Library sections">
        {LIBRARY_TABS.map((item) => {
          const active = item.id === tab.id;
          return (
            <Link
              key={item.id}
              href={`/dashboard/media?tab=${item.id}`}
              className={cn(
                "inline-flex min-h-11 items-center border-b-2 px-3 text-sm",
                active
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <LibraryPanel
        role={tab.role}
        empty={tab.empty}
        canWrite={write.allowed}
        writeReason={write.allowed ? null : write.reason}
        items={items.map((item) => ({
          id: item.id,
          source: item.source,
          role: item.role,
          mimeType: item.mimeType,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}
