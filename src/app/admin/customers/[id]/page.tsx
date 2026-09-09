import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/site/status-badge";
import { MessageComposer } from "@/components/admin/message-composer";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDate, formatDateTime, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Customer", robots: { index: false, follow: false } };

export default async function AdminCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      bookings: { orderBy: { createdAt: "desc" }, include: { items: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!customer) notFound();

  const lifetime = customer.bookings
    .filter((b) => b.status === "COMPLETED" && b.quotedTotal)
    .reduce((sum, b) => sum + Number(b.quotedTotal), 0);

  return (
    <>
      <PageHeader
        title={customer.name}
        description={customer.email}
        action={
          <Button asChild variant="ghost">
            <Link href="/admin/customers">Back to customers</Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title={`Bookings (${customer.bookings.length})`}>
            {customer.bookings.length === 0 ? (
              <p className="text-[0.9375rem] text-sage">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-border">
                {customer.bookings.map((booking) => (
                  <li key={booking.id}>
                    <Link
                      href={`/admin/bookings/${booking.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 py-4"
                    >
                      <div>
                        <p className="font-medium text-ink">
                          {booking.items.map((i) => i.nameSnapshot).join(", ") || "Custom job"}
                        </p>
                        <p className="mt-0.5 text-sm text-sage">
                          {booking.reference} · {formatDate(booking.preferredDate)}
                          {booking.quotedTotal ? ` · ${formatMoney(Number(booking.quotedTotal))}` : ""}
                        </p>
                      </div>
                      <StatusBadge status={booking.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Send a message">
            <MessageComposer
              recipientId={customer.id}
              defaultEmail={customer.email}
              defaultPhone={customer.phone ?? ""}
            />
          </Panel>

          {customer.messages.length > 0 && (
            <Panel title="Message history">
              <ul className="space-y-3">
                {customer.messages.map((message) => (
                  <li key={message.id} className="seam pl-5">
                    <p className="font-medium text-ink">{message.subject ?? message.channel}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-sage">
                      {message.body.replace(/<[^>]+>/g, " ").slice(0, 180)}
                    </p>
                    <p className="mt-1 text-xs text-sage">
                      {message.status.toLowerCase()} · {formatDateTime(message.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </div>

        <Panel title="Details">
          <dl className="space-y-4">
            {[
              ["Email", customer.email],
              ["Phone", customer.phone ?? "—"],
              ["Postcode", customer.postcode ?? "—"],
              ["Address", [customer.addressLine1, customer.city].filter(Boolean).join(", ") || "—"],
              ["Joined", formatDate(customer.createdAt)],
              ["Last signed in", customer.lastLoginAt ? formatDateTime(customer.lastLoginAt) : "Never"],
              ["Marketing", customer.marketingOptIn ? "Opted in" : "Not opted in"],
              ["Completed work", formatMoney(lifetime) ?? "£0"],
            ].map(([term, value]) => (
              <div key={term}>
                <dt className="text-sm text-sage">{term}</dt>
                <dd className="mt-0.5 break-words text-[0.9375rem] text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </Panel>
      </div>
    </>
  );
}
