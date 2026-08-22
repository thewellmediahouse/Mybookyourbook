import { getCloudflareContext } from "@opennextjs/cloudflare";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createDb } from "@/lib/db/client";
import { createAuth } from "./create-auth";
import { isGoogleAuthConfigured, isEmailSendingConfigured } from "./env";

export async function getAuth() {
  const { env, ctx } = await getCloudflareContext({ async: true });
  return createAuth(createDb(env.DB), env, {
    waitUntil: (promise) => ctx.waitUntil(promise),
  });
}

export async function getSession() {
  const auth = await getAuth();
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireUser() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  return session;
}

export async function emailSendingEnabled() {
  const { env } = await getCloudflareContext({ async: true });
  return isEmailSendingConfigured(env);
}

export async function googleAuthEnabled() {
  const { env } = await getCloudflareContext({ async: true });
  return isGoogleAuthConfigured(env);
}
