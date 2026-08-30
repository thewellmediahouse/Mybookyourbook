import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SimpleCreateWizard } from "@/components/create/simple-wizard";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { PageIntro } from "@/components/dashboard/page-intro";
import { requireProjectAccess } from "@/lib/authz";
import { canManageBrands } from "@/lib/authz/roles";
import { getBrandWithLogo } from "@/lib/businesses/queries";
import { getWalletBalance } from "@/lib/credits";
import { getPublicConcept } from "@/lib/creative/queries";
import { produceAvailability } from "@/lib/dashboard/produce";
import { requireStudio } from "@/lib/dashboard/studio";
import { getOrCreateIdentity } from "@/lib/identity/consent";
import { getIdentityBundle, isReferenceProfileReady } from "@/lib/identity/queries";
import { libraryWriteAvailability } from "@/lib/media/availability";
import { listReusableLibraryAssets } from "@/lib/media/queries";
import { DEFAULT_DURATION } from "@/lib/projects/brief";
import { CREATE_BODY, CREATE_HEADING, resolveSimpleWizardStep } from "@/lib/projects/copy";
import { getLatestDraft, getProjectBrief } from "@/lib/projects/queries";
import { briefReadyForConcept } from "@/lib/projects/save";
import { isCreateWizardStatus, isInProductionStatus } from "@/lib/projects/status";

export const metadata: Metadata = { title: "Create Advert" };

export default async function CreateAdvertPage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string; new?: string; step?: string }>;
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
  const latestDraft =
    requestedId || params.new === "1"
      ? null
      : await getLatestDraft(studio.db, studio.active.workspaceId, studio.userId);
  const draft = loaded ?? (latestDraft ? await getProjectBrief(studio.db, latestDraft.id) : null);

  if (draft && draft.workspaceId !== studio.active.workspaceId) {
    redirect("/dashboard/create?new=1");
  }
  if (draft && isInProductionStatus(draft.status)) {
    redirect(`/dashboard/commercials/${draft.id}/production`);
  }
  if (draft && !isCreateWizardStatus(draft.status)) {
    redirect(`/dashboard/commercials/${draft.id}`);
  }

  await getOrCreateIdentity(studio.db, studio.active.workspaceId, studio.userId);
  const identity = await getIdentityBundle(studio.db, studio.active.workspaceId, studio.userId);
  const profileReady = isReferenceProfileReady(identity);
  const brandId = draft?.businessId ?? studio.activeBrandId ?? studio.active.businesses[0]?.id ?? "";
  const brand = brandId ? await getBrandWithLogo(studio.db, brandId) : null;
  const library =
    brandId && produce.allowed
      ? await listReusableLibraryAssets(studio.db, {
          workspaceId: studio.active.workspaceId,
          businessId: brandId,
        })
      : [];
  const concept = draft ? await getPublicConcept(studio.db, draft.id) : null;
  const credits = await getWalletBalance(studio.db, studio.active.workspaceId);
  const extrasWrite = libraryWriteAvailability({
    role: studio.role,
    memberStatus: studio.memberStatus,
    brandId: brandId || null,
  });
  const briefReady = draft
    ? briefReadyForConcept({
        title: draft.title,
        objective: draft.objective,
        ctaType: draft.ctaType,
        style: draft.style,
        platform: draft.platform,
        aspectRatio: draft.aspectRatio,
        duration: draft.duration,
      }).ready
    : false;
  const step = resolveSimpleWizardStep({
    requested: params.step,
    profileReady,
    conceptApproved: Boolean(concept?.approved),
    hasConcept: Boolean(concept),
    briefReady,
  });

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro kicker="CREATE" title={CREATE_HEADING} description={CREATE_BODY} />
      {!produce.allowed ? (
        <div className="mt-10">
          <DisabledAction label="Create Advert" reason={produce.reason} />
        </div>
      ) : studio.active.businesses.length === 0 ? (
        <p className="mt-10 text-muted">Add a brand before creating an advert.</p>
      ) : (
        <SimpleCreateWizard
          brands={studio.active.businesses}
          library={library.filter((item) => item.role !== "logo")}
          concept={concept}
          briefLocked={draft?.status === "READY_TO_PRODUCE"}
          credits={credits}
          initialStep={step}
          profileReady={profileReady}
          consented={Boolean(identity?.consented)}
          firstName={studio.firstName}
          businessName={brand?.name ?? studio.active.name}
          identityAssets={identity?.assets ?? {}}
          brand={brand ? { id: brand.id, logoAssetId: brand.logoAssetId } : null}
          canEditBrand={canManageBrands(studio.role)}
          extrasWrite={extrasWrite}
          initial={{
            projectId: draft?.id ?? null,
            businessId: brandId,
            title: !draft || draft.title === "Untitled commercial" ? "" : draft.title,
            objective: draft?.objective ?? "",
            targetCustomer: draft?.targetCustomer ?? "",
            problem: draft?.problem ?? "",
            valueProposition: draft?.valueProposition ?? "",
            offer: draft?.offer ?? "",
            ctaType: draft?.ctaType ?? "",
            ctaValue: draft?.ctaValue ?? "",
            style: draft?.style ?? "",
            tones: draft?.tones ?? [],
            avoid: draft?.avoid ?? "",
            platform: draft?.platform ?? "",
            aspectRatio: draft?.aspectRatio ?? "",
            duration: draft?.duration ?? DEFAULT_DURATION,
            references: draft?.references ?? [],
          }}
        />
      )}
    </main>
  );
}
