import type { Metadata } from "next";
import { switchBrand } from "@/app/dashboard/brand/actions";
import { BrandForm } from "@/components/brand/brand-form";
import { PageIntro } from "@/components/dashboard/page-intro";
import { canManageBrands } from "@/lib/authz/roles";
import { getBrandLogoAsset } from "@/lib/businesses/queries";
import { requireStudio } from "@/lib/dashboard/studio";
import { brandsDescription } from "@/lib/workspaces/copy";

export const metadata: Metadata = { title: "Brands" };

export default async function BrandsPage() {
  const studio = await requireStudio();
  const canEdit = canManageBrands(studio.role);
  const preferred = studio.activeBrandId;
  const brands = await Promise.all(
    studio.active.businesses.map(async (brand) => {
      const logo = await getBrandLogoAsset(studio.db, brand.id);
      return { ...brand, hasLogo: Boolean(logo) };
    }),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STUDIO"
        title="Brands"
        description={brandsDescription(studio.active.type)}
      />
      {brands.length === 0 ? (
        <p className="mt-10 rounded-lg border border-border bg-surface p-6 text-muted">
          No brands are saved in this studio yet.
        </p>
      ) : (
        <ul className="mt-10 grid gap-3 sm:grid-cols-2">
          {brands.map((brand) => (
            <li key={brand.id}>
              <form action={switchBrand}>
                <input type="hidden" name="businessId" value={brand.id} />
                <input type="hidden" name="next" value="/dashboard/brand" />
                <button
                  type="submit"
                  className="block w-full rounded-lg border border-border bg-surface p-5 text-left transition-colors hover:border-accent"
                >
                  <p className="text-foreground">{brand.name}</p>
                  <p className="mt-2 text-sm text-muted">
                    {brand.hasLogo ? "Logo saved" : "No logo yet"}
                    {preferred === brand.id ? " · Current" : ""}
                  </p>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
      {canEdit ? (
        <section className="mt-12">
          <h2 className="font-display text-2xl text-foreground">Add another brand</h2>
          <BrandForm
            mode="create"
            workspaceId={studio.active.workspaceId}
            canEdit={canEdit}
            values={{
              name: "",
              website: "",
              tagline: "",
              phone: "",
              email: "",
              whatsapp: "",
              primaryColor: "",
              secondaryColor: "",
              defaultCta: "",
              defaultLogoPosition: "bottom-right",
              industry: "",
              city: "",
              description: "",
            }}
          />
        </section>
      ) : null}
    </main>
  );
}
