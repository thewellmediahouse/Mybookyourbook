import type { Metadata } from "next";
import { IdentityActions } from "@/components/identity/identity-actions";
import { IdentityCapture } from "@/components/identity/identity-capture";
import { IdentityConsentForm } from "@/components/identity/consent-form";
import { PageIntro } from "@/components/dashboard/page-intro";
import { formatStudioDate } from "@/lib/dashboard/format";
import { requireStudio } from "@/lib/dashboard/studio";
import { getOrCreateIdentity } from "@/lib/identity/consent";
import { IDENTITY_BODY, IDENTITY_HEADING } from "@/lib/identity/copy";
import { getIdentityBundle } from "@/lib/identity/queries";

export const metadata: Metadata = { title: "AI Identity" };

export default async function IdentityPage() {
  const studio = await requireStudio();
  await getOrCreateIdentity(studio.db, studio.active.workspaceId, studio.userId);
  const bundle = await getIdentityBundle(studio.db, studio.active.workspaceId, studio.userId);
  const businessName = studio.active.businesses[0]?.name ?? studio.active.name;
  const consented = Boolean(bundle?.consented);
  const hasVideo = Boolean(bundle?.assets.IDENTITY_VIDEO);
  const hasPhotos = Boolean(
    bundle?.assets.IDENTITY_FRONT && bundle?.assets.IDENTITY_LEFT && bundle?.assets.IDENTITY_RIGHT,
  );

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro kicker="IDENTITY" title={IDENTITY_HEADING} description={IDENTITY_BODY} />
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
    </main>
  );
}
