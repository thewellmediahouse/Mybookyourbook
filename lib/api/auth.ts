import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { assertCanManageBrands, loadAssetAccess, loadBusinessAccess } from "@/lib/authz";
import { AuthzError } from "@/lib/authz/errors";

export async function requireApiSession() {
  const session = await getSession();
  if (!session) {
    throw new AuthzError("UNAUTHENTICATED", "Sign in required.");
  }
  return session;
}

export async function requireBrandEditor(businessId: string) {
  const session = await requireApiSession();
  const db = await getDb();
  const ctx = await loadBusinessAccess(db, session.user.id, businessId);
  assertCanManageBrands(ctx);
  return ctx;
}

export async function requireOwnedAsset(assetId: string) {
  const session = await requireApiSession();
  const db = await getDb();
  return loadAssetAccess(db, session.user.id, assetId);
}
