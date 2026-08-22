import { PageIntro } from "@/components/dashboard/page-intro";
import { getDb } from "@/lib/db/client";
import { listPromptFrameworks } from "@/lib/admin/settings";
import { PromptForm } from "@/components/admin/prompt-form";

export default async function AdminPromptsPage() {
  const rows = await listPromptFrameworks(await getDb());
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title="Prompt Frameworks" />
      <PromptForm />
      <ul className="mt-10 divide-y divide-border rounded-lg border border-border bg-surface">
        {rows.length === 0 ? <li className="px-4 py-4 text-muted">No frameworks saved.</li> : null}
        {rows.map((row) => (
          <li key={row.id} className="px-4 py-4 text-sm text-muted">
            {row.key} v{row.version} {row.active ? "· active" : ""}
          </li>
        ))}
      </ul>
    </main>
  );
}
