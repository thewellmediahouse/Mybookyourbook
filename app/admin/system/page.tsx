import { PageIntro } from "@/components/dashboard/page-intro";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export default async function AdminSystemPage() {
  const { env } = await getCloudflareContext({ async: true });
  const mode = String((env as { AI_PROVIDER_MODE?: string }).AI_PROVIDER_MODE ?? "mock");
  const filming = String((env as { FILMING_AI_MODE?: string }).FILMING_AI_MODE ?? "follow-ai");
  const concept = String((env as { CONCEPT_AI_MODE?: string }).CONCEPT_AI_MODE ?? "follow-ai");
  const payments = String((env as { PAYMENTS_MODE?: string }).PAYMENTS_MODE ?? "test");
  const runtime = String((env as { NEXTJS_ENV?: string }).NEXTJS_ENV ?? "development");
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STAFF"
        title="System"
        description="Runtime flags only. Secrets are never displayed."
      />
      <ul className="mt-8 grid gap-3">
        <li className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">AI_PROVIDER_MODE</p>
          <p className="mt-1 text-foreground">{mode}</p>
        </li>
        <li className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">FILMING_AI_MODE</p>
          <p className="mt-1 text-foreground">{filming}</p>
        </li>
        <li className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">CONCEPT_AI_MODE</p>
          <p className="mt-1 text-foreground">{concept}</p>
        </li>
        <li className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">PAYMENTS_MODE</p>
          <p className="mt-1 text-foreground">{payments}</p>
        </li>
        <li className="rounded-lg border border-border bg-surface p-4">
          <p className="text-sm text-muted">NEXTJS_ENV</p>
          <p className="mt-1 text-foreground">{runtime}</p>
        </li>
      </ul>
    </main>
  );
}
