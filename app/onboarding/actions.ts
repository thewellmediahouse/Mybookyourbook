"use server";

import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { getBusinessImporter } from "@/lib/importers/business";
import { WORKSPACE_TYPES, type WorkspaceType } from "@/lib/authz/roles";
import { isLogoPosition } from "@/lib/businesses/fields";
import { ACTIVE_BRAND_COOKIE } from "@/lib/businesses/queries";
import { createWorkspaceForOwner } from "@/lib/workspaces/create";
import { ACTIVE_WORKSPACE_COOKIE, userHasWorkspace } from "@/lib/workspaces/queries";
import { RateLimitError } from "@/lib/security/errors";
import { assertRateLimit } from "@/lib/security/rate-limit";

export type OnboardingState = { error: string } | null;

function optionalHex(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  if (!/^#[0-9A-Fa-f]{6}$/.test(trimmed)) {
    throw new Error("Brand colours must look like #1678FF, or be left blank.");
  }
  return trimmed;
}

export async function completeOnboarding(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const session = await requireUser();
  const db = await getDb();

  if (await userHasWorkspace(db, session.user.id)) {
    redirect("/dashboard");
  }

  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const studioName = String(formData.get("studioName") ?? "").trim();
  const typeValue = String(formData.get("type") ?? "");
  const country = String(formData.get("country") ?? "").trim();
  const skippedIdentity = formData.get("skipIdentity") === "on";

  if (!firstName || !lastName) {
    return { error: "Enter your first and last name." };
  }
  if (!studioName) {
    return { error: "Enter your business or studio name." };
  }
  if (!(WORKSPACE_TYPES as readonly string[]).includes(typeValue)) {
    return { error: "Choose whether this is one business or an agency." };
  }
  if (!country) {
    return { error: "Choose the country you bill from." };
  }
  const logoPosition = String(formData.get("defaultLogoPosition") ?? "bottom-right").trim() || "bottom-right";
  if (!isLogoPosition(logoPosition)) {
    return { error: "Choose a logo position we support." };
  }
  if (!skippedIdentity) {
    return {
      error:
        "You can skip showing who you are for now, but you must confirm that before finishing setup.",
    };
  }

  await db
    .update(profiles)
    .set({ firstName, lastName, updatedAt: new Date() })
    .where(eq(profiles.userId, session.user.id));

  try {
    const created = await createWorkspaceForOwner(db, {
      ownerUserId: session.user.id,
      name: studioName,
      type: typeValue as WorkspaceType,
      country,
      business: {
        name: studioName,
        website: String(formData.get("website") ?? ""),
        industry: String(formData.get("industry") ?? ""),
        city: String(formData.get("city") ?? ""),
        description: String(formData.get("description") ?? ""),
        tagline: String(formData.get("tagline") ?? ""),
        phone: String(formData.get("phone") ?? ""),
        email: String(formData.get("email") ?? ""),
        whatsapp: String(formData.get("whatsapp") ?? ""),
        primaryColor: optionalHex(String(formData.get("primaryColor") ?? "")),
        secondaryColor: optionalHex(String(formData.get("secondaryColor") ?? "")),
        defaultCta: String(formData.get("defaultCta") ?? ""),
        defaultLogoPosition: logoPosition,
      },
    });

    const jar = await cookies();
    jar.set(ACTIVE_WORKSPACE_COOKIE, created.workspaceId, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
    jar.set(ACTIVE_BRAND_COOKIE, created.businessId, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't finish setup. Try again." };
  }

  redirect("/dashboard");
}

export async function previewWebsiteImport(formData: FormData) {
  const session = await requireUser();
  const url = String(formData.get("website") ?? "").trim();
  if (!url) {
    return { error: "Enter a website address first." as const, result: null };
  }
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return { error: "Use a normal website address." as const, result: null };
    }
    const db = await getDb();
    await assertRateLimit(db, "import", session.user.id);
    const result = await getBusinessImporter().import(parsed.toString());
    return { error: null, result };
  } catch (error) {
    if (error instanceof RateLimitError) {
      return { error: error.message, result: null };
    }
    return { error: "That website address doesn't look valid." as const, result: null };
  }
}
