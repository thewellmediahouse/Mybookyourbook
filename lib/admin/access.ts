import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/lib/auth";
import { parseAdminEmails } from "@/lib/authz/admin";
import { AuthzError } from "@/lib/authz/errors";
import { assertPlatformAdmin } from "@/lib/authz/guards";
import { getDb, type Db } from "@/lib/db/client";

export type AdminActor = {
  db: Db;
  userId: string;
  email: string;
};

export function assertAdminActor(email: string, adminEmails: string[]): void {
  assertPlatformAdmin(email, adminEmails);
}

export async function requireAdminApi(): Promise<AdminActor> {
  const session = await getSession();
  if (!session) {
    throw new AuthzError("UNAUTHENTICATED", "Sign in required.");
  }
  const { env } = await getCloudflareContext({ async: true });
  const emails = parseAdminEmails(
    "ADMIN_EMAILS" in env ? String((env as { ADMIN_EMAILS?: string }).ADMIN_EMAILS ?? "") : "",
  );
  assertAdminActor(session.user.email, emails);
  return {
    db: await getDb(),
    userId: session.user.id,
    email: session.user.email,
  };
}
