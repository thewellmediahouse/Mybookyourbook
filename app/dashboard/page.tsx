import Link from "next/link";
import { CommercialList } from "@/components/dashboard/commercial-list";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { EmptyCommercials } from "@/components/dashboard/empty-commercials";
import { PageIntro } from "@/components/dashboard/page-intro";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { Button } from "@/components/ui/button";
import { buyCreditsHoldReason } from "@/lib/billing/availability";
import { CREATE_BUTTON, WELCOME_SUBHEADING, welcomeHeading } from "@/lib/dashboard/copy";
import { produceAvailability } from "@/lib/dashboard/produce";
import { requireStudio } from "@/lib/dashboard/studio";
import { getDashboardSummary, listCommercials } from "@/lib/dashboard/summary";

export default async function DashboardPage() {
  const studio = await requireStudio();
  const produce = produceAvailability({
    role: studio.role,
    memberStatus: studio.memberStatus,
    workspaceStatus: studio.workspaceStatus,
  });
  const [summary, commercials, buyReason] = await Promise.all([
    getDashboardSummary(studio.db, studio.active.workspaceId),
    listCommercials(studio.db, studio.active.workspaceId, 8),
    buyCreditsHoldReason(studio.role),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        title={welcomeHeading(studio.firstName)}
        description={WELCOME_SUBHEADING}
        actions={
          produce.allowed ? (
            <Button asChild>
              <Link href="/dashboard/create">{CREATE_BUTTON}</Link>
            </Button>
          ) : (
            <DisabledAction label={CREATE_BUTTON} reason={produce.reason} />
          )
        }
      />
      <SummaryCards summary={summary} buyReason={buyReason} />
      {summary.projectCount === 0 ? (
        <EmptyCommercials
          canCreate={produce.allowed}
          blockedReason={produce.allowed ? undefined : produce.reason}
        />
      ) : (
        <CommercialList items={commercials} />
      )}
    </main>
  );
}
