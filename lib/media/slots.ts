import type { LibraryRole } from "@/lib/r2/keys";

export const LIBRARY_TABS = [
  { id: "logos", label: "Logos", role: "logo", empty: "No logos saved for this brand yet." },
  { id: "products", label: "Products", role: "product", empty: "No product photos saved yet." },
  {
    id: "business",
    label: "Business",
    role: "business",
    empty: "No business photos saved yet.",
  },
  {
    id: "locations",
    label: "Locations",
    role: "location",
    empty: "No location photos saved yet.",
  },
  {
    id: "campaign",
    label: "Campaign References",
    role: "campaign",
    empty: "No campaign reference photos saved yet.",
  },
] as const;

export type LibraryTabId = (typeof LIBRARY_TABS)[number]["id"];

export function parseLibraryTab(value: string | undefined): (typeof LIBRARY_TABS)[number] {
  const match = LIBRARY_TABS.find((tab) => tab.id === value);
  return match ?? LIBRARY_TABS[0];
}

export function parseLibraryRole(value: string): LibraryRole | null {
  const key = value.trim().toLowerCase();
  if (
    key === "logo" ||
    key === "product" ||
    key === "business" ||
    key === "location" ||
    key === "campaign"
  ) {
    return key;
  }
  return null;
}

export function libraryRoleLabel(role: LibraryRole): string {
  if (role === "logo") {
    return "Logo";
  }
  if (role === "product") {
    return "Product";
  }
  if (role === "business") {
    return "Business";
  }
  if (role === "location") {
    return "Location";
  }
  return "Campaign reference";
}
