import type { Metadata } from "next";
import { BrandForm } from "@/components/brand/brand-form";
import { LogoUploader } from "@/components/brand/logo-uploader";
import { PageIntro } from "@/components/dashboard/page-intro";
import { canManageBrands } from "@/lib/authz/roles";
import { getBrandWithLogo } from "@/lib/businesses/queries";
import { requireStudio } from "@/lib/dashboard/studio";

export const metadata: Metadata = { title: "Brand" };

export default async function BrandPage() {
  const studio = await requireStudio();
  const businessId = studio.activeBrandId;
  const canEdit = canManageBrands(studio.role);
  const brand = businessId ? await getBrandWithLogo(studio.db, businessId) : null;

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="BRAND"
        title={brand?.name ?? "Brand"}
        description="Company details and logo used when we add your brand to a finished commercial."
      />
      {!brand ? (
        <p className="mt-10 rounded-lg border border-border bg-surface p-6 text-muted">
          This studio has no brand yet. Add one from Brands.
        </p>
      ) : (
        <>
          <div className="mt-10">
            <LogoUploader businessId={brand.id} logoAssetId={brand.logoAssetId} canEdit={canEdit} />
          </div>
          <BrandForm
            mode="edit"
            businessId={brand.id}
            canEdit={canEdit}
            values={{
              name: brand.name,
              website: brand.website ?? "",
              tagline: brand.tagline ?? "",
              phone: brand.phone ?? "",
              email: brand.email ?? "",
              whatsapp: brand.whatsapp ?? "",
              primaryColor: brand.primaryColor ?? "",
              secondaryColor: brand.secondaryColor ?? "",
              defaultCta: brand.defaultCta ?? "",
              defaultLogoPosition: brand.defaultLogoPosition ?? "bottom-right",
              industry: brand.industry ?? "",
              city: brand.city ?? "",
              description: brand.description ?? "",
            }}
          />
        </>
      )}
    </main>
  );
}
