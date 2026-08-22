import { PageIntro } from "@/components/dashboard/page-intro";
import { getDb } from "@/lib/db/client";
import { getAiSettings, LOCKED_AI } from "@/lib/admin/settings";
import { AiSettingsForm } from "@/components/admin/ai-form";

export default async function AdminAiPage() {
  const settings = await getAiSettings(await getDb());
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STAFF"
        title="AI Settings"
        description="Non-secret configuration only. API keys stay in Wrangler secrets."
      />
      <p className="mt-4 text-sm text-muted">
        Locked: source {LOCKED_AI.seedanceSourceResolution}, duration {LOCKED_AI.defaultDurationSeconds}s, final{" "}
        {LOCKED_AI.finalResolution}.
      </p>
      <AiSettingsForm settings={settings} />
    </main>
  );
}
