import { PageIntro } from "@/components/dashboard/page-intro";
import { CleanupButton } from "@/components/admin/cleanup-button";
import { getDb } from "@/lib/db/client";
import { getAdminStorage } from "@/lib/admin/queries";

export default async function AdminStoragePage() {
  const storage = await getAdminStorage(await getDb());
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STAFF"
        title="Storage"
        description="Counts from file metadata. Run Cleanup only processes files already marked deleted. There is no bucket wipe."
      />
      <ul className="mt-8 grid gap-3">
        <Row label="R2 assets" value={`${storage.files} files · ${storage.bytes} bytes`} />
        <Row label="Final videos" value={`${storage.finalFiles} files · ${storage.finalBytes} bytes`} />
        <Row label="Identity assets" value={`${storage.identityFiles} files · ${storage.identityBytes} bytes`} />
        <Row label="Pending deletion" value={`${storage.pendingDeletion} files · ${storage.pendingBytes} bytes`} />
      </ul>
      <CleanupButton />
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="rounded-lg border border-border bg-surface p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-foreground">{value}</p>
    </li>
  );
}
