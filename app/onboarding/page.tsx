import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { requireUser } from "@/lib/auth";
import { getDb } from "@/lib/db/client";
import { profiles } from "@/lib/db/schema";
import { userHasWorkspace } from "@/lib/workspaces/queries";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const session = await requireUser();
  const db = await getDb();
  if (await userHasWorkspace(db, session.user.id)) {
    redirect("/dashboard/create");
  }

  const [profile] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, session.user.id))
    .limit(1);

  const firstName =
    profile?.firstName ||
    (typeof session.user.firstName === "string" ? session.user.firstName : "") ||
    session.user.name.split(/\s+/)[0] ||
    "";
  const lastName =
    profile?.lastName ||
    (typeof session.user.lastName === "string" ? session.user.lastName : "") ||
    session.user.name.split(/\s+/).slice(1).join(" ") ||
    "";

  return (
    <AuthShell
      title="Set up your studio"
      description="Five short steps. You can skip showing who you are until you are ready to produce."
    >
      <OnboardingForm firstName={firstName} lastName={lastName} email={session.user.email} />
    </AuthShell>
  );
}
