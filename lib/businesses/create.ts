import type { Db } from "@/lib/db/client";
import { businesses } from "@/lib/db/schema";
import { newId } from "@/lib/id";
import { emptyToNull, isLogoPosition, parseBrandHex, type BrandInput } from "./fields";

export async function createBrand(db: Db, workspaceId: string, country: string, input: BrandInput) {
  const name = input.name.trim();
  if (!name) {
    throw new Error("Enter a brand name.");
  }
  const position = input.defaultLogoPosition?.trim() || "bottom-right";
  if (!isLogoPosition(position)) {
    throw new Error("Choose a logo position we support.");
  }
  const now = new Date();
  const id = newId();
  await db.insert(businesses).values({
    id,
    workspaceId,
    name,
    website: emptyToNull(input.website),
    industry: emptyToNull(input.industry),
    country: emptyToNull(input.country) ?? country,
    city: emptyToNull(input.city),
    description: emptyToNull(input.description),
    tagline: emptyToNull(input.tagline),
    phone: emptyToNull(input.phone),
    email: emptyToNull(input.email),
    whatsapp: emptyToNull(input.whatsapp),
    primaryColor: parseBrandHex(input.primaryColor ?? "", "Primary colour"),
    secondaryColor: parseBrandHex(input.secondaryColor ?? "", "Secondary colour"),
    defaultCta: emptyToNull(input.defaultCta),
    defaultLogoPosition: position,
    timezone: emptyToNull(input.timezone),
    createdAt: now,
    updatedAt: now,
  });
  return { businessId: id };
}
