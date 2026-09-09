import type { Metadata } from "next";
import { PageHeader, Panel, EmptyState } from "@/components/admin/page-header";
import { MessageComposer } from "@/components/admin/message-composer";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { formatDateTime, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages", robots: { index: false, follow: false } };

const TONE = { SENT: "good", FAILED: "bad", SKIPPED: "warn", QUEUED: "neutral" } as const;

export default async function AdminMessagesPage() {
  await requireAdmin();
  const messages = await prisma.messageLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    include: { recipient: { select: { name: true } }, booking: { select: { reference: true } } },
  });

  return (
    <>
      <PageHeader
        title="Messages"
        description="Everything the site has sent, plus anything you send from here. Nothing goes out silently."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <Panel title="Send something" description="Emails use the So Fresh template. Private notes are never sent anywhere.">
          <MessageComposer />
        </Panel>

        <Panel title="Recent activity">
          {messages.length === 0 ? (
            <EmptyState title="Nothing sent yet" body="Booking confirmations and quotes will appear here as they go out." />
          ) : (
            <ul className="divide-y divide-border">
              {messages.map((message) => (
                <li key={message.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <Badge variant={TONE[message.status]}>{message.status.toLowerCase()}</Badge>
                    <span className="text-sm text-sage">{message.channel.toLowerCase().replace(/_/g, " ")}</span>
                    {message.booking && <span className="text-sm text-sage">{message.booking.reference}</span>}
                  </div>
                  <p className="mt-2 font-medium text-ink">{message.subject ?? "(no subject)"}</p>
                  <p className="mt-0.5 text-sm text-sage">
                    To {message.recipient?.name ?? message.toAddress} · {formatDateTime(message.createdAt)}
                  </p>
                  {message.error && <p className="mt-1.5 text-sm text-destructive">{message.error}</p>}
                  <p className="mt-2 text-sm leading-relaxed text-sage">
                    {truncate(message.body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(), 160)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
