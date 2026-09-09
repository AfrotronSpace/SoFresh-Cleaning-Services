import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MessageCircle, Mail, Phone } from "lucide-react";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { BookingEditor } from "@/components/admin/booking-editor";
import { StatusBadge } from "@/components/site/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";
import { forwardBookingToWhatsAppAction } from "@/app/actions/admin";
import {
  ACCESS_LABELS, CONDITION_LABELS, CONTACT_PREFERENCE_LABELS,
  OCCUPANCY_LABELS, PROPERTY_KINDS, URGENCY_LABELS,
} from "@/lib/constants";
import { formatDate, formatDateTime, telLink, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Booking", robots: { index: false, follow: false } };

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [booking, settings] = await Promise.all([
    prisma.booking.findUnique({
      where: { id },
      include: {
        items: true,
        attachments: true,
        events: { orderBy: { createdAt: "desc" } },
        messages: { orderBy: { createdAt: "desc" }, take: 10 },
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    loadSettings(),
  ]);

  if (!booking) notFound();

  const summaryForWhatsApp = [
    `Booking ${booking.reference}`,
    `${booking.contactName} — ${booking.contactPhone}`,
    booking.items.map((i) => i.nameSnapshot).join(", ") || "Custom job",
    `${booking.postcode} · ${formatDate(booking.preferredDate)}`,
  ].join("\n");

  return (
    <>
      <PageHeader
        title={booking.reference}
        description={`Requested ${formatDateTime(booking.createdAt)}${booking.user ? " by a signed-in customer" : " as a guest"}.`}
        action={
          <Button asChild variant="ghost">
            <Link href="/admin/bookings">Back to bookings</Link>
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-2.5">
        <StatusBadge status={booking.status} />
        {booking.urgency !== "STANDARD" && <Badge variant="warn">{URGENCY_LABELS[booking.urgency]}</Badge>}
        {booking.isCustom && <Badge variant="accent">Custom brief</Badge>}
        {booking.petsOnSite && <Badge variant="neutral">Pets on site</Badge>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <Panel title="The job">
            {booking.items.length > 0 ? (
              <ul className="space-y-4">
                {booking.items.map((item) => (
                  <li key={item.id}>
                    <p className="font-medium text-ink">{item.nameSnapshot}</p>
                    {item.extras.length > 0 && (
                      <p className="mt-1 text-[0.9375rem] text-sage">Extras: {item.extras.join(", ")}</p>
                    )}
                    {item.priceSnapshot && (
                      <p className="mt-1 text-sm text-sage">
                        Listed at £{item.priceSnapshot.toString()} when they booked ({item.priceMode.toLowerCase().replace(/_/g, " ")})
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-sage">
                {booking.customBrief ?? "No services selected."}
              </p>
            )}

            {booking.notes && (
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-sm text-sage">Their notes</p>
                <p className="mt-1.5 whitespace-pre-wrap text-[0.9375rem] leading-relaxed text-ink">{booking.notes}</p>
              </div>
            )}
          </Panel>

          <Panel title="Property and access">
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
              <Row term="Property">{PROPERTY_KINDS[booking.propertyKind]}</Row>
              <Row term="Bedrooms / bathrooms">
                {booking.bedrooms ?? "—"} / {booking.bathrooms ?? "—"}
              </Row>
              <Row term="Occupancy">{OCCUPANCY_LABELS[booking.occupancy]}</Row>
              <Row term="Condition">{CONDITION_LABELS[booking.condition]}</Row>
              <Row term="Address">
                {[booking.addressLine1, booking.addressLine2, booking.city, booking.postcode].filter(Boolean).join(", ")}
              </Row>
              <Row term="Preferred date">
                {formatDate(booking.preferredDate)}
                {booking.datesFlexible && " (flexible)"}
              </Row>
              <Row term="Alternative date">
                {booking.alternativeDate ? formatDate(booking.alternativeDate) : "—"}
              </Row>
              <Row term="Time of day">{booking.timePreference ?? "—"}</Row>
              <Row term="Access">{ACCESS_LABELS[booking.accessMethod]}</Row>
              <Row term="Parking">{booking.parkingNotes ?? "—"}</Row>
              <Row term="Allergies / products">{booking.allergyNotes ?? "—"}</Row>
              <Row term="Urgency">{URGENCY_LABELS[booking.urgency]}</Row>
            </dl>
          </Panel>

          <Panel title="History" description="Every status change and message on this booking.">
            <ol className="space-y-4">
              {booking.events.map((event) => (
                <li key={event.id} className="seam pl-5">
                  <p className="font-medium text-ink">{event.label}</p>
                  {event.detail && <p className="mt-0.5 text-[0.9375rem] text-sage">{event.detail}</p>}
                  <p className="mt-1 text-sm text-sage">
                    {formatDateTime(event.createdAt)}
                    {event.actor ? ` · ${event.actor}` : ""}
                  </p>
                </li>
              ))}
            </ol>

            {booking.messages.length > 0 && (
              <div className="mt-7 border-t border-border pt-5">
                <p className="text-sm text-sage">Messages sent</p>
                <ul className="mt-3 space-y-2.5">
                  {booking.messages.map((message) => (
                    <li key={message.id} className="flex flex-wrap items-center gap-x-3 text-sm">
                      <Badge variant={message.status === "SENT" ? "good" : message.status === "FAILED" ? "bad" : "neutral"}>
                        {message.status.toLowerCase()}
                      </Badge>
                      <span className="text-ink">{message.subject ?? message.channel}</span>
                      <span className="text-sage">{message.toAddress}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <Panel title="The customer">
            <p className="font-medium text-ink">{booking.contactName}</p>
            <p className="mt-1 text-sm text-sage">
              Prefers {CONTACT_PREFERENCE_LABELS[booking.contactPreference].toLowerCase()}
            </p>

            <div className="mt-5 space-y-2.5">
              <a
                href={whatsappLink(booking.contactPhone, `Hi ${booking.contactName.split(" ")[0]}, about your booking ${booking.reference}:`)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 text-[0.9375rem] text-verdant hover:underline"
              >
                <MessageCircle className="size-4 shrink-0" />
                {booking.contactPhone}
              </a>
              <a href={telLink(booking.contactPhone)} className="flex items-center gap-2.5 text-[0.9375rem] text-sage hover:text-forest">
                <Phone className="size-4 shrink-0" />
                Call
              </a>
              <a
                href={`mailto:${booking.contactEmail}?subject=${encodeURIComponent(`Your booking ${booking.reference}`)}`}
                className="flex items-center gap-2.5 break-all text-[0.9375rem] text-sage hover:text-forest"
              >
                <Mail className="size-4 shrink-0" />
                {booking.contactEmail}
              </a>
            </div>

            {booking.user && (
              <p className="mt-5 border-t border-border pt-4 text-sm text-sage">
                Has an account —{" "}
                <Link href={`/admin/customers/${booking.user.id}`} className="text-verdant underline underline-offset-2">
                  see all their bookings
                </Link>
              </p>
            )}
          </Panel>

          <Panel title="Update this booking" description="Set a price and, if you want, email the customer at the same time.">
            <BookingEditor
              id={booking.id}
              status={booking.status}
              quotedTotal={booking.quotedTotal ? booking.quotedTotal.toString() : null}
              quoteNotes={booking.quoteNotes}
              adminNotes={booking.adminNotes}
            />
          </Panel>

          <Panel title="Forward to WhatsApp">
            {settings.whatsappForwardNumber ? (
              <>
                <p className="text-[0.9375rem] leading-relaxed text-sage">
                  Sends a summary to {settings.whatsappForwardNumber}.
                  {booking.whatsappForwardedAt && ` Last sent ${formatDateTime(booking.whatsappForwardedAt)}.`}
                </p>
                <form action={forwardBookingToWhatsAppAction} className="mt-4">
                  <input type="hidden" name="id" value={booking.id} />
                  <input type="hidden" name="to" value={settings.whatsappForwardNumber} />
                  <Button type="submit" variant="subtle" size="sm">Forward now</Button>
                </form>
                <a
                  href={whatsappLink(settings.whatsappForwardNumber, summaryForWhatsApp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-medium text-verdant underline underline-offset-4"
                >
                  Or open it in WhatsApp yourself
                </a>
              </>
            ) : (
              <p className="text-[0.9375rem] leading-relaxed text-sage">
                No forwarding number set.{" "}
                <Link href="/admin/settings" className="text-verdant underline underline-offset-2">Add one in settings</Link>.
              </p>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}

function Row({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-sage">{term}</dt>
      <dd className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink">{children}</dd>
    </div>
  );
}
