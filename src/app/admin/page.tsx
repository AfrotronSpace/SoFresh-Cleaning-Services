import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, MessageCircleOff, MailWarning } from "lucide-react";
import { PageHeader, Panel, EmptyState } from "@/components/admin/page-header";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";
import { formatDate, formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Overview", robots: { index: false, follow: false } };

export default async function AdminOverviewPage() {
  await requireAdmin();
  const settings = await loadSettings();

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [inReview, quoted, confirmedThisWeek, newEnquiries, recent, pipeline, serviceCount] = await Promise.all([
    prisma.booking.count({ where: { status: "IN_REVIEW" } }),
    prisma.booking.count({ where: { status: "QUOTED" } }),
    prisma.booking.count({ where: { status: "CONFIRMED", updatedAt: { gte: weekAgo } } }),
    prisma.enquiry.count({ where: { status: "NEW" } }),
    prisma.booking.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { items: true } }),
    prisma.booking.aggregate({
      _sum: { quotedTotal: true },
      where: { status: { in: ["QUOTED", "CONFIRMED"] } },
    }),
    prisma.service.count({ where: { active: true } }),
  ]);

  const warnings = [
    !process.env.SMTP_HOST && {
      icon: MailWarning,
      text: "No mail server is connected, so notification emails are logged but not sent. Add your SMTP details to .env.",
    },
    settings.forwardBookingsToWhatsapp &&
      !process.env.WHATSAPP_ACCESS_TOKEN && {
        icon: MessageCircleOff,
        text: "WhatsApp forwarding is on but the Cloud API isn't connected. Each booking gives you a one-tap link instead.",
      },
    serviceCount === 0 && {
      icon: AlertTriangle,
      text: "No services are published, so customers can't book anything yet.",
    },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; text: string }[];

  return (
    <>
      <PageHeader
        title="Overview"
        description="Everything waiting on you, and what's come in recently."
        action={
          <Button asChild>
            <Link href="/admin/bookings">All bookings</Link>
          </Button>
        }
      />

      {warnings.length > 0 && (
        <ul className="mb-8 space-y-2.5">
          {warnings.map((warning) => (
            <li key={warning.text} className="flex items-start gap-3 rounded-lg bg-champagne-soft/40 px-4 py-3 text-[0.9375rem] leading-relaxed text-[#5c4715]">
              <warning.icon className="mt-0.5 size-4 shrink-0" />
              {warning.text}
            </li>
          ))}
        </ul>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Waiting for review" value={inReview} href="/admin/bookings?status=IN_REVIEW" emphasis={inReview > 0} />
        <Stat label="Quoted, awaiting reply" value={quoted} href="/admin/bookings?status=QUOTED" />
        <Stat label="Confirmed this week" value={confirmedThisWeek} href="/admin/bookings?status=CONFIRMED" />
        <Stat label="New enquiries" value={newEnquiries} href="/admin/enquiries" emphasis={newEnquiries > 0} />
      </div>

      <div className="mb-8 rounded-2xl border border-border bg-white p-6">
        <p className="text-sm text-sage">Quoted and confirmed work on the books</p>
        <p className="mt-1.5 font-display text-[2rem] leading-none text-forest">
          {formatMoney(pipeline._sum.quotedTotal ? Number(pipeline._sum.quotedTotal) : 0) ?? "£0"}
        </p>
        <p className="mt-2 text-sm text-sage">Total of every quote you&rsquo;ve issued that hasn&rsquo;t yet been completed or cancelled.</p>
      </div>

      <Panel title="Latest bookings">
        {recent.length === 0 ? (
          <EmptyState
            title="No bookings yet"
            body="As soon as someone completes the booking form, it lands here and, if switched on, in your inbox and on WhatsApp."
          />
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((booking) => (
              <li key={booking.id}>
                <Link href={`/admin/bookings/${booking.id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:bg-haze/60">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">
                      {booking.contactName} · {booking.items.map((i) => i.nameSnapshot).join(", ") || "Custom job"}
                    </p>
                    <p className="mt-0.5 text-sm text-sage">
                      {booking.reference} · {booking.postcode} · {formatDate(booking.preferredDate)}
                    </p>
                  </div>
                  <StatusBadge status={booking.status} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function Stat({ label, value, href, emphasis }: { label: string; value: number; href: string; emphasis?: boolean }) {
  return (
    <Link
      href={href}
      className={`block rounded-2xl border bg-white p-5 transition-shadow hover:shadow-[var(--shadow-lift)] ${
        emphasis ? "border-champagne" : "border-border"
      }`}
    >
      <p className="text-sm text-sage">{label}</p>
      <p className="mt-1.5 font-display text-[2rem] leading-none text-forest">{value}</p>
    </Link>
  );
}
