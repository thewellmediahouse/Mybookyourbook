import type { Metadata } from "next";
import { CommercialList } from "@/components/dashboard/commercial-list";
import { EmptyCommercials } from "@/components/dashboard/empty-commercials";
import { PageIntro } from "@/components/dashboard/page-intro";
import { COMMERCIALS_HEADING } from "@/lib/dashboard/copy";
import { produceAvailability } from "@/lib/dashboard/produce";
import { requireStudio } from "@/lib/dashboard/studio";
import { listCommercials } from "@/lib/dashboard/summary";

export const metadata: Metadata = { title: "My Adverts" };

export default async function CommercialsPage() {
  const studio = await requireStudio();
  const produce = produceAvailability({
    role: studio.role,
    memberStatus: studio.memberStatus,
    workspaceStatus: studio.workspaceStatus,
  });
  const commercials = await listCommercials(studio.db, studio.active.workspaceId);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STUDIO"
        title={COMMERCIALS_HEADING}
        description="Each commercial belongs to this studio. Counts and statuses come from your saved work, not sample data."
      />
      {commercials.length === 0 ? (
        <EmptyCommercials
          canCreate={produce.allowed}
          blockedReason={produce.allowed ? undefined : produce.reason}
        />
      ) : (
        <CommercialList items={commercials} heading={false} />
      )}
    </main>
  );
}
