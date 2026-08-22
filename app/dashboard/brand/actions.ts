"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { assertCanManageBrands, loadBusinessAccess, loadWorkspaceMember } from "@/lib/authz";
import { createBrand } from "@/lib/businesses/create";
import type { BrandInput } from "@/lib/businesses/fields";
import { ACTIVE_BRAND_COOKIE } from "@/lib/businesses/queries";
import { updateBrand } from "@/lib/businesses/update";
import { getDb } from "@/lib/db/client";

export type BrandActionState = { error?: string; message?: string };

function readBrandInput(formData: FormData): BrandInput {
  return {
    name: String(formData.get("name") ?? ""),
    website: String(formData.get("website") ?? ""),
    industry: String(formData.get("industry") ?? ""),
    city: String(formData.get("city") ?? ""),
    description: String(formData.get("description") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    primaryColor: String(formData.get("primaryColor") ?? ""),
    secondaryColor: String(formData.get("secondaryColor") ?? ""),
    defaultCta: String(formData.get("defaultCta") ?? ""),
    defaultLogoPosition: String(formData.get("defaultLogoPosition") ?? ""),
  };
}

export async function saveBrand(
  _prev: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const session = await requireUser();
  const businessId = String(formData.get("businessId") ?? "");
  const db = await getDb();
  try {
    const ctx = await loadBusinessAccess(db, session.user.id, businessId);
    assertCanManageBrands(ctx);
    await updateBrand(db, businessId, readBrandInput(formData));
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't save that brand." };
  }
  return { message: "Brand saved." };
}

export async function addBrand(
  _prev: BrandActionState,
  formData: FormData,
): Promise<BrandActionState> {
  const session = await requireUser();
  const workspaceId = String(formData.get("workspaceId") ?? "");
  const db = await getDb();
  try {
    const ctx = await loadWorkspaceMember(db, session.user.id, workspaceId);
    assertCanManageBrands(ctx);
    const created = await createBrand(db, workspaceId, ctx.workspace.country, readBrandInput(formData));
    const jar = await cookies();
    jar.set(ACTIVE_BRAND_COOKIE, created.businessId, {
      path: "/",
      sameSite: "lax",
      httpOnly: true,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "We couldn't add that brand." };
  }
  redirect("/dashboard/brand");
}

export async function switchBrand(formData: FormData) {
  const session = await requireUser();
  const businessId = String(formData.get("businessId") ?? "");
  const db = await getDb();
  await loadBusinessAccess(db, session.user.id, businessId);
  const jar = await cookies();
  jar.set(ACTIVE_BRAND_COOKIE, businessId, {
    path: "/",
    sameSite: "lax",
    httpOnly: true,
  });
  const next = String(formData.get("next") ?? "");
  if (next === "/dashboard/brand") {
    redirect("/dashboard/brand");
  }
}
