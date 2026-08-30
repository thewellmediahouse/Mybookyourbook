import type { Metadata } from "next";
import { LogoUploader } from "@/components/brand/logo-uploader";
import { ExtraRefsUploader } from "@/components/create/extra-refs";
import { PageIntro } from "@/components/dashboard/page-intro";
import { IdentityActions } from "@/components/identity/identity-actions";
import { IdentityConsentForm } from "@/components/identity/consent-form";
import { IdentityCapture } from "@/components/identity/identity-capture";
import { canManageBrands } from "@/lib/authz/roles";
import { getBrandWithLogo } from "@/lib/businesses/queries";
import { formatStudioDate } from "@/lib/dashboard/format";
import { requireStudio } from "@/lib/dashboard/studio";
import { getOrCreateIdentity } from "@/lib/identity/consent";
import { IDENTITY_BODY, IDENTITY_HEADING } from "@/lib/identity/copy";
import { getIdentityBundle } from "@/lib/identity/queries";
import { libraryWriteAvailability } from "@/lib/media/availability";
import { listReusableLibraryAssets } from "@/lib/media/queries";

export const metadata: Metadata = { title: "Reference Profile" };

export default async function ReferenceProfilePage() {
  const studio = await requireStudio();
  await getOrCreateIdentity(studio.db, studio.active.workspaceId, studio.userId);
  const bundle = await getIdentityBundle(studio.db, studio.active.workspaceId, studio.userId);
  const brandId = studio.activeBrandId ?? studio.active.businesses[0]?.id ?? "";
  const brand = brandId ? await getBrandWithLogo(studio.db, brandId) : null;
  const extras = brandId
    ? await listReusableLibraryAssets(studio.db, {
        workspaceId: studio.active.workspaceId,
        businessId: brandId,
      })
    : [];
  const write = libraryWriteAvailability({
    role: studio.role,
    memberStatus: studio.memberStatus,
    brandId: brandId || null,
  });
  const businessName = brand?.name ?? studio.active.name;
  const consented = Boolean(bundle?.consented);
  const hasVideo = Boolean(bundle?.assets.IDENTITY_VIDEO);
  const hasPhotos = Boolean(
    bundle?.assets.IDENTITY_FRONT && bundle?.assets.IDENTITY_LEFT && bundle?.assets.IDENTITY_RIGHT,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro kicker="PROFILE" title={IDENTITY_HEADING} description={IDENTITY_BODY} />
      {bundle ? (
        <dl className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-surface p-5">
            <dt className="text-sm text-muted">Status</dt>
            <dd className="mt-2 capitalize text-foreground">{bundle.status}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <dt className="text-sm text-muted">Created</dt>
            <dd className="mt-2 text-foreground">{formatStudioDate(bundle.createdAt)}</dd>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <dt className="text-sm text-muted">Updated</dt>
            <dd className="mt-2 text-foreground">{formatStudioDate(bundle.updatedAt)}</dd>
          </div>
        </dl>
      ) : null}
      {!consented ? (
        <IdentityConsentForm />
      ) : (
        <>
          <IdentityActions
            hasVideo={hasVideo}
            hasPhotos={hasPhotos}
            hasAnything={Boolean(bundle && Object.keys(bundle.assets).length > 0)}
          />
          <div id="identity-capture">
            <IdentityCapture
              firstName={studio.firstName}
              businessName={businessName}
              assets={bundle?.assets ?? {}}
            />
          </div>
        </>
      )}
      {brand ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-foreground">Logo</h2>
          <p className="mt-3 text-muted">We add this after filming, so the spelling stays exact.</p>
          <div className="mt-6">
            <LogoUploader
              businessId={brand.id}
              logoAssetId={brand.logoAssetId}
              canEdit={canManageBrands(studio.role)}
            />
          </div>
        </section>
      ) : (
        <p className="mt-12 text-muted">Add a brand before we can save a logo on this profile.</p>
      )}
      <ExtraRefsUploader
        canWrite={write.allowed}
        writeReason={write.allowed ? null : write.reason}
        items={extras.filter((item) => item.role !== "logo")}
      />
    </main>
  );
}
