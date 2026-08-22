"use client";

import { switchBrand } from "@/app/dashboard/brand/actions";

export function BrandSwitcher({
  brands,
  activeId,
}: {
  brands: { id: string; name: string }[];
  activeId: string | null;
}) {
  if (brands.length < 2) {
    return null;
  }

  return (
    <form action={switchBrand} className="flex flex-col gap-1.5">
      <label htmlFor="businessId" className="text-xs tracking-[0.12em] text-muted">
        BRAND
      </label>
      <select
        id="businessId"
        name="businessId"
        defaultValue={activeId ?? brands[0].id}
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
        className="h-11 w-full max-w-56 rounded-md border border-border bg-surface px-3 text-sm text-foreground lg:max-w-none"
      >
        {brands.map((brand) => (
          <option key={brand.id} value={brand.id}>
            {brand.name}
          </option>
        ))}
      </select>
    </form>
  );
}
