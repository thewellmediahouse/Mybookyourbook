import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StudioBoard } from "@/components/create/studio-board";
import { SimpleCreateWizard } from "@/components/create/simple-wizard";
import { DisabledAction } from "@/components/dashboard/disabled-action";
import { listCommercials } from "@/lib/dashboard/summary";
import { requireProjectAccess } from "@/lib/authz";
import { canManageBrands, canProduce } from "@/lib/authz/roles";
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

export const metadata: Metadata = { title: "Studio" };

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
  const candidate = loaded ?? (latestDraft ? await getProjectBrief(studio.db, latestDraft.id) : null);
  const draft =
    candidate && candidate.workspaceId === studio.active.workspaceId && isCreateWizardStatus(candidate.status)
      ? candidate
      : null;

  if (loaded && loaded.workspaceId !== studio.active.workspaceId) {
    redirect("/dashboard/create?new=1");
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
    freshStart: params.new === "1",
  });

  const commercials = (await listCommercials(studio.db, studio.active.workspaceId)).filter(
    (item) => item.finalAssetId || isInProductionStatus(item.status) || item.status === "READY" || item.status === "FAILED",
  );

  const wizard = !produce.allowed ? (
    <DisabledAction label="Create Advert" reason={produce.reason} />
  ) : studio.active.businesses.length === 0 ? (
    <p className="text-muted">Add a brand before creating an advert.</p>
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
      freshStart={params.new === "1"}
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
  );

  return (
    <StudioBoard
      wizard={
        <>
          <p className="text-xs tracking-[0.18em] text-muted">CREATE</p>
          <h1 className="mt-2 font-display text-3xl text-foreground">{CREATE_HEADING}</h1>
          <p className="mt-2 text-sm text-muted">{CREATE_BODY}</p>
          <div className="mt-6">{wizard}</div>
        </>
      }
      items={commercials}
      canDelete={canProduce(studio.role)}
    />
  );
}
