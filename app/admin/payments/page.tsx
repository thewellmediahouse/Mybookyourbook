import { PageIntro } from "@/components/dashboard/page-intro";
import { AdminTable } from "@/components/admin/admin-table";
import { RecordMoneyRefundForm } from "@/components/admin/money-refund-form";
import { paymentStatusLabel } from "@/lib/billing/copy";
import { formatMoney } from "@/lib/plans/format";
import { getDb } from "@/lib/db/client";
import { listAdminPayments } from "@/lib/admin/queries";

export default async function AdminPaymentsPage() {
  const rows = await listAdminPayments(await getDb());
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10 lg:py-16">
      <PageIntro
        kicker="STAFF"
        title="Payments"
        description="Record money returned only after you have refunded the payment in Payoneer Checkout. This does not add Ad Credits."
      />
      <AdminTable headers={["Reference", "Status", "Amount", "Workspace", "Money returned"]} empty={rows.length === 0}>
        {rows.map((row) => (
          <tr key={row.id} className="border-b border-border last:border-0">
            <td className="px-4 py-3 text-foreground">{row.providerReference}</td>
            <td className="px-4 py-3 text-muted">{paymentStatusLabel(row.status)}</td>
            <td className="px-4 py-3 text-muted">{formatMoney(row.amountMinor, row.currency)}</td>
            <td className="px-4 py-3 text-muted">{row.workspaceId.slice(0, 8)}</td>
            <td className="px-4 py-3">
              {row.status === "success" ? (
                <RecordMoneyRefundForm paymentId={row.id} />
              ) : (
                <p className="text-muted">
                  {row.status === "refunded" ? "Already recorded." : "Not a confirmed payment."}
                </p>
              )}
            </td>
          </tr>
        ))}
      </AdminTable>
    </main>
  );
}
