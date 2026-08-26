import { notFound } from "next/navigation";
import { PageIntro } from "@/components/dashboard/page-intro";
import { TicketReplyForm } from "@/components/admin/ticket-reply-form";
import { TicketStatusForm } from "@/components/admin/ticket-form";
import { formatStudioDate } from "@/lib/dashboard/format";
import { getDb } from "@/lib/db/client";
import { getAdminTicketDetail } from "@/lib/admin/queries";

export default async function AdminSupportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminTicketDetail(await getDb(), id);
  if (!detail) {
    notFound();
  }
  const { ticket, replies } = detail;
  const customerName = ticket.customerName || ticket.contactName || "Not signed in";
  const customerEmail = ticket.customerEmail || ticket.contactEmail || "No email on file";
  const studio = ticket.studioName || (ticket.workspaceId ? ticket.workspaceId.slice(0, 8) : "No studio");

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10 lg:py-16">
      <PageIntro kicker="STAFF" title={ticket.subject} description={`${ticket.category} · ${ticket.status}`} />
      <dl className="mt-8 grid gap-3 text-sm sm:grid-cols-2">
        <Item label="Customer" value={customerName} />
        <Item label="Email" value={customerEmail} />
        <Item label="Studio" value={studio} />
        <Item label="Commercial" value={ticket.projectTitle ?? "None linked"} />
        <Item label="Received" value={formatStudioDate(ticket.createdAt)} />
        <Item label="Updated" value={formatStudioDate(ticket.updatedAt)} />
      </dl>
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Message</h2>
        <p className="mt-4 whitespace-pre-wrap rounded-lg border border-border bg-surface p-5 text-foreground">
          {ticket.message}
        </p>
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Conversation</h2>
        {replies.length === 0 ? (
          <p className="mt-4 text-muted">No replies yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface">
            {replies.map((reply) => (
              <li key={reply.id} className="px-5 py-4">
                <p className="text-sm text-muted">
                  {reply.authorRole === "staff" ? "Staff" : "Customer"} · {formatStudioDate(reply.createdAt)}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-foreground">{reply.body}</p>
              </li>
            ))}
          </ul>
        )}
        {ticket.status === "CLOSED" ? (
          <p className="mt-4 text-sm text-muted">This conversation is closed.</p>
        ) : (
          <TicketReplyForm ticketId={ticket.id} />
        )}
      </section>
      <section className="mt-10">
        <h2 className="font-display text-2xl text-foreground">Status</h2>
        <div className="mt-4">
          <TicketStatusForm ticketId={ticket.id} status={ticket.status} />
        </div>
      </section>
    </main>
  );
}

function Item({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-4">
      <dt className="text-muted">{label}</dt>
      <dd className="mt-2 break-all text-foreground">{value}</dd>
    </div>
  );
}
