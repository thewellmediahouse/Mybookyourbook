import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { PageIntro } from "@/components/dashboard/page-intro";
import { requireStudio } from "@/lib/dashboard/studio";
import { profiles } from "@/lib/db/schema";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfileSettingsPage() {
  const studio = await requireStudio();
  const [profile] = await studio.db
    .select()
    .from(profiles)
    .where(eq(profiles.userId, studio.userId))
    .limit(1);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="SETTINGS"
        title="Profile"
        description="Your name is used to greet you in the studio. Email changes are not available here yet."
      />
      <ProfileForm
        email={studio.email}
        firstName={profile?.firstName ?? studio.firstName}
        lastName={profile?.lastName ?? studio.lastName}
        timezone={profile?.timezone ?? ""}
        country={profile?.country ?? ""}
      />
    </main>
  );
}
