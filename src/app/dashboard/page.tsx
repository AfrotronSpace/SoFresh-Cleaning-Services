import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, MapPin, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/site/status-badge";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";
import { buildMetadata } from "@/lib/seo";
import { formatDate, formatMoney, whatsappLink } from "@/lib/utils";
import { BOOKING_STATUS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = buildMetadata({ title: "Your bookings", path: "/dashboard", noIndex: true });

export default async function DashboardPage() {
  const session = await requireUser();
  const [settings, bookings] = await Promise.all([
    loadSettings(),
    prisma.booking.findMany({
      where: { OR: [{ userId: session.id }, { contactEmail: session.email }] },
      orderBy: { createdAt: "desc" },
      include: { items: true, events: { orderBy: { createdAt: "desc" }, take: 3 } },
    }),
  ]);

  const active = bookings.filter((b) => !["COMPLETED", "CANCELLED", "DECLINED"].includes(b.status));
  const past = bookings.filter((b) => ["COMPLETED", "CANCELLED", "DECLINED"].includes(b.status));

  return (
    <div className="shell py-12 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-[2rem] leading-tight md:text-[2.5rem]">
            Hello, {session.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-[1.0625rem] text-sage">
            {bookings.length === 0
              ? "Nothing booked yet."
              : `${active.length} booking${active.length === 1 ? "" : "s"} in progress.`}
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/book">Request another booking</Link>
        </Button>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-border bg-white p-10 text-center">
          <h2 className="font-display text-xl">Your bookings will appear here</h2>
          <p className="mx-auto mt-3 max-w-[48ch] text-[0.9375rem] leading-relaxed text-sage">
            Once you&rsquo;ve sent us a request, you&rsquo;ll be able to follow it from review through to quote and confirmed date,
            without digging through your inbox.
          </p>
          <Button asChild className="mt-7" size="lg">
            <Link href="/services">Browse services</Link>
          </Button>
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          {active.length > 0 && (
            <section aria-labelledby="active-heading">
              <h2 id="active-heading" className="font-display text-xl">In progress</h2>
              <ul className="mt-5 space-y-4">
                {active.map((booking) => (
                  <li key={booking.id}>
                    <article className="rounded-2xl border border-border bg-white p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h3 className="font-display text-lg text-ink">
                            {booking.items.map((i) => i.nameSnapshot).join(", ") || "Custom job"}
                          </h3>
                          <p className="mt-1.5 text-[0.9375rem] text-sage">{BOOKING_STATUS[booking.status].customer}</p>
                        </div>
                        <StatusBadge status={booking.status} />
                      </div>

                      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3 text-[0.9375rem]">
                        <Meta icon={Hash} label="Reference">{booking.reference}</Meta>
                        <Meta icon={CalendarDays} label="Preferred date">{formatDate(booking.preferredDate)}</Meta>
                        <Meta icon={MapPin} label="Postcode">{booking.postcode}</Meta>
                      </dl>

                      {booking.quotedTotal && (
                        <div className="mt-5 rounded-lg bg-champagne-soft/40 px-4 py-3">
                          <p className="text-[0.9375rem] font-semibold text-[#5c4715]">
                            Your price: {formatMoney(Number(booking.quotedTotal))}
                          </p>
                          {booking.quoteNotes && (
                            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#5c4715]/85">
                              {booking.quoteNotes}
                            </p>
                          )}
                        </div>
                      )}

                      {booking.events.length > 0 && (
                        <ol className="mt-5 space-y-2 border-t border-border pt-4 text-sm text-sage">
                          {booking.events.map((event) => (
                            <li key={event.id} className="flex flex-wrap gap-x-3">
                              <span className="text-ink">{event.label}</span>
                              <span>{formatDate(event.createdAt)}</span>
                            </li>
                          ))}
                        </ol>
                      )}

                      <div className="mt-5 flex flex-wrap gap-3">
                        <Button asChild size="sm" variant="whatsapp">
                          <a
                            href={whatsappLink(settings.whatsapp, `Hi, about booking ${booking.reference}:`)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            Message about this
                          </a>
                        </Button>
                        <Button asChild size="sm" variant="outline">
                          <a href={`mailto:${settings.email}?subject=${encodeURIComponent(`Booking ${booking.reference}`)}`}>
                            Email us
                          </a>
                        </Button>
                      </div>
                    </article>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {past.length > 0 && (
            <section aria-labelledby="past-heading">
              <h2 id="past-heading" className="font-display text-xl">Previously</h2>
              <ul className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white">
                {past.map((booking) => (
                  <li key={booking.id} className="flex flex-wrap items-center justify-between gap-3 p-5">
                    <div>
                      <p className="font-medium text-ink">
                        {booking.items.map((i) => i.nameSnapshot).join(", ") || "Custom job"}
                      </p>
                      <p className="mt-0.5 text-sm text-sage">
                        {booking.reference} · {formatDate(booking.preferredDate)}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}

      <p className="mt-12 max-w-[62ch] text-sm leading-relaxed text-sage">
        Payments are never taken through this website. Once you&rsquo;ve accepted a price we&rsquo;ll arrange payment with you directly
        by bank transfer or a secure payment link.
      </p>
    </div>
  );
}

function Meta({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="size-4 shrink-0 text-champagne" strokeWidth={1.75} />
      <div>
        <dt className="sr-only">{label}</dt>
        <dd className="font-medium text-ink">{children}</dd>
      </div>
    </div>
  );
}
