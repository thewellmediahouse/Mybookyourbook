import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdStudio } from "@/components/create/ad-studio";
import { CreateWizard } from "@/components/create/wizard";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { PageIntro } from "@/components/dashboard/page-intro";
import { requireProjectAccess } from "@/lib/authz";
import { getWalletBalance } from "@/lib/credits";
import { getPublicConcept } from "@/lib/creative/queries";
import { produceAvailability } from "@/lib/dashboard/produce";
import { requireStudio } from "@/lib/dashboard/studio";
import { listReusableLibraryAssets } from "@/lib/media/queries";
import { DEFAULT_DURATION } from "@/lib/projects/brief";
import {
  CREATE_BODY,
  CREATE_HEADING,
  STUDIO_BODY,
  STUDIO_HEADING,
  STUDIO_KICKER,
} from "@/lib/projects/copy";
import { getLatestDraft, getProjectBrief } from "@/lib/projects/queries";
import { isCreateWizardStatus, isInProductionStatus } from "@/lib/projects/status";

export const metadata: Metadata = { title: "Ad Studio" };

export default async function CreateCommercialPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; new?: string; step?: string; lane?: string }>;
}) {
  const studio = await requireStudio();
  const produce = produceAvailability({
    role: studio.role,
    memberStatus: studio.memberStatus,
    workspaceStatus: studio.workspaceStatus,
  });
  const params = await searchParams;
  const requestedId = params.project;
  if (requestedId) {
    await requireProjectAccess(requestedId);
  }
  const loaded = requestedId ? await getProjectBrief(studio.db, requestedId) : null;
  const latestDraft = requestedId
    ? null
    : await getLatestDraft(studio.db, studio.active.workspaceId, studio.userId);

  if (loaded && loaded.workspaceId !== studio.active.workspaceId) {
    redirect("/dashboard/create");
  }
  if (loaded && isInProductionStatus(loaded.status)) {
    redirect(`/dashboard/commercials/${loaded.id}/production`);
  }
  if (loaded && !isCreateWizardStatus(loaded.status)) {
    redirect(`/dashboard/commercials/${loaded.id}`);
  }

  const brandId = loaded?.businessId ?? studio.activeBrandId ?? studio.active.businesses[0]?.id ?? "";
  const library =
    brandId && produce.allowed
      ? await listReusableLibraryAssets(studio.db, {
          workspaceId: studio.active.workspaceId,
          businessId: brandId,
        })
      : [];
  const concept = loaded ? await getPublicConcept(studio.db, loaded.id) : null;
  const credits = await getWalletBalance(studio.db, studio.active.workspaceId);
  const showWizard = Boolean(loaded);

  return (
    <main className={`mx-auto w-full px-6 py-10 lg:py-16 ${showWizard ? "max-w-3xl" : "max-w-6xl"}`}>
      <PageIntro
        kicker={showWizard ? "CREATE" : STUDIO_KICKER}
        title={showWizard ? CREATE_HEADING : STUDIO_HEADING}
        description={showWizard ? CREATE_BODY : STUDIO_BODY}
      />
      {!produce.allowed ? (
        <div className="mt-10">
          <DisabledAction label="Start brief" reason={produce.reason} />
        </div>
      ) : studio.active.businesses.length === 0 ? (
        <p className="mt-10 text-muted">Add a brand before creating a commercial.</p>
      ) : showWizard && loaded ? (
        <CreateWizard
          brands={studio.active.businesses}
          library={library}
          concept={concept}
          briefLocked={loaded.status === "READY_TO_PRODUCE"}
          credits={credits}
          initialStep={params.step}
          lane={params.lane}
          initial={{
            projectId: loaded.id,
            businessId: brandId,
            title: loaded.title === "Untitled commercial" ? "" : loaded.title,
            objective: loaded.objective ?? "",
            targetCustomer: loaded.targetCustomer ?? "",
            problem: loaded.problem ?? "",
            valueProposition: loaded.valueProposition ?? "",
            offer: loaded.offer ?? "",
            ctaType: loaded.ctaType ?? "",
            ctaValue: loaded.ctaValue ?? "",
            style: loaded.style ?? "",
            tones: loaded.tones ?? [],
            avoid: loaded.avoid ?? "",
            platform: loaded.platform ?? "",
            aspectRatio: loaded.aspectRatio ?? "",
            duration: loaded.duration ?? DEFAULT_DURATION,
            references: loaded.references ?? [],
          }}
        />
      ) : (
        <AdStudio
          brands={studio.active.businesses}
          defaultBrandId={brandId}
          draftProjectId={latestDraft?.id ?? null}
        />
      )}
    </main>
  );
}
