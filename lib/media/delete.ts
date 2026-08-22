import { eq } from "drizzle-orm";
import type { Db } from "@/lib/db/client";
import { assets } from "@/lib/db/schema";

export async function scheduleLibraryDelete(db: Db, assetId: string) {
  const [asset] = await db.select().from(assets).where(eq(assets.id, assetId)).limit(1);
  if (!asset || asset.deletedAt) {
    throw new Error("That file is not in the library.");
  }
  if (asset.category !== "library") {
    throw new Error("That file cannot be removed from the library.");
  }
  const now = new Date();
  await db
    .update(assets)
    .set({ deletedAt: now, updatedAt: now })
    .where(eq(assets.id, assetId));
  return [asset.r2ObjectKey];
}
