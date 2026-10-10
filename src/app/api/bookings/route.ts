import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { bookingSchema } from "@/lib/validations";
import { loadSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { sendEmail, emailShell } from "@/lib/email";
import { forwardToWhatsApp } from "@/lib/whatsapp";
import { SITE } from "@/lib/constants";
import { formatDate, formatUkNumber, generateReference } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "We couldn't read that request." }, { status: 400 });
  }

  const parsed = bookingSchema.safeParse(payload);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return NextResponse.json({ error: "Please check the highlighted fields.", fieldErrors }, { status: 422 });
  }

  const data = parsed.data;

  // Bots fill hidden fields. Answer 200 so they don't learn anything.
  if (data.company) return NextResponse.json({ reference: "SF-THANKS" }, { status: 200 });

  const [settings, session] = await Promise.all([loadSettings(), getSession()]);

  // Freeze the catalogue entries so later price edits don't rewrite history.
  const services = data.items.length
    ? await prisma.service.findMany({ where: { id: { in: data.items.map((i) => i.serviceId) } } })
    : [];

  if (!data.isCustom && services.length !== data.items.length) {
    return NextResponse.json({ error: "One of those services is no longer available." }, { status: 409 });
  }

  // Reference collisions are vanishingly unlikely, but cheap to rule out.
  let reference = generateReference();
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const clash = await prisma.booking.findUnique({ where: { reference }, select: { id: true } });
    if (!clash) break;
    reference = generateReference();
  }

  const booking = await prisma.booking.create({
    data: {
      reference,
      userId: session?.id,
      contactName: data.contactName,
      contactEmail: data.contactEmail,
      contactPhone: data.contactPhone,
      contactPreference: data.contactPreference,
      addressLine1: data.addressLine1 || null,
      addressLine2: data.addressLine2 || null,
      city: data.city || null,
      postcode: data.postcode,
      propertyKind: data.propertyKind,
      bedrooms: data.bedrooms ?? null,
      bathrooms: data.bathrooms ?? null,
      occupancy: data.occupancy,
      condition: data.condition,
      preferredDate: new Date(data.preferredDate),
      alternativeDate: data.alternativeDate ? new Date(data.alternativeDate) : null,
      timePreference: data.timePreference || null,
      datesFlexible: data.datesFlexible,
      urgency: data.urgency,
      accessMethod: data.accessMethod,
      parkingNotes: data.parkingNotes || null,
      petsOnSite: data.petsOnSite,
      allergyNotes: data.allergyNotes || null,
      notes: data.notes || null,
      isCustom: data.isCustom,
      customBrief: data.customBrief || null,
      marketingOptIn: data.marketingOptIn,
      status: "IN_REVIEW",
      source: "WEBSITE",
      items: {
        create: data.items.map((item) => {
          const service = services.find((s) => s.id === item.serviceId)!;
          return {
            serviceId: service.id,
            nameSnapshot: service.name,
            priceSnapshot: service.price as Prisma.Decimal | null,
            priceMode: service.priceMode,
            quantity: item.quantity,
            extras: item.extras,
            notes: item.notes ?? null,
          };
        }),
      },
      events: {
        create: {
          label: "Booking requested",
          detail: `Submitted from the website${session ? " while signed in" : " as a guest"}.`,
          actor: "system",
        },
      },
    },
    include: { items: true },
  });

  // Keep the customer's saved address fresh for next time.
  if (session) {
    await prisma.user.update({
      where: { id: session.id },
      data: {
        phone: data.contactPhone,
        postcode: data.postcode,
        addressLine1: data.addressLine1 || undefined,
        city: data.city || undefined,
      },
    }).catch(() => undefined);
  }

  const serviceList = booking.items.length
    ? booking.items.map((i) => i.nameSnapshot).join(", ")
    : "Custom job (described by the customer)";

  // --- notifications ------------------------------------------------
  // Every one of these is a switch in the admin dashboard.
  const notifications: Promise<unknown>[] = [];

  if (settings.emailBookingToCustomer) {
    notifications.push(
      sendEmail({
        to: booking.contactEmail,
        bookingId: booking.id,
        recipientId: session?.id,
        subject: `We've got your booking request — ${booking.reference}`,
        html: emailShell({
          contact: settings,
          preheader: "Your booking is in review. We'll be in touch with a price shortly.",
          heading: `Thanks, ${booking.contactName.split(" ")[0]} — your booking is in review`,
          body: `
            <p>We've received your request and a member of our team will be in touch shortly.</p>
            <p><strong>Reference:</strong> ${booking.reference}<br>
            <strong>Service:</strong> ${serviceList}<br>
            <strong>Preferred date:</strong> ${formatDate(booking.preferredDate)}<br>
            <strong>Postcode:</strong> ${booking.postcode}</p>
            <p>This is a request rather than a confirmed appointment. Nothing is reserved and no payment is due until we've sent your price and you've accepted it.</p>
            <p>If you've asked for a quote, we may come back for a few more details, photos or a short video so we can price it accurately. Sending those on WhatsApp is usually quickest: <a href="https://wa.me/${settings.whatsapp}">${formatUkNumber(settings.whatsapp)}</a>.</p>
            <p>We look forward to helping you bring that So Fresh feeling back to your space.</p>
          `,
          cta: { label: "View your booking", url: `${SITE.url}/booking-received/${booking.reference}` },
        }),
      }).then(() =>
        prisma.booking.update({ where: { id: booking.id }, data: { customerEmailSentAt: new Date() } }),
      ),
    );
  }

  if (settings.emailBookingToAdmin) {
    notifications.push(
      sendEmail({
        to: settings.adminNotifyEmail,
        cc: settings.adminNotifyCc,
        replyTo: booking.contactEmail,
        bookingId: booking.id,
        subject: `New booking ${booking.reference} — ${booking.postcode} — ${serviceList}`,
        html: emailShell({
          heading: `New booking request: ${booking.reference}`,
          body: `
            <p><strong>${booking.contactName}</strong> · ${booking.contactPhone} · ${booking.contactEmail}<br>
            Prefers: ${booking.contactPreference.toLowerCase()}</p>
            <p><strong>Service:</strong> ${serviceList}<br>
            <strong>Property:</strong> ${booking.propertyKind.toLowerCase().replace(/_/g, " ")}${booking.bedrooms ? `, ${booking.bedrooms} bed` : ""}${booking.bathrooms ? `, ${booking.bathrooms} bath` : ""}<br>
            <strong>Condition:</strong> ${booking.condition.toLowerCase().replace(/_/g, " ")}<br>
            <strong>Occupancy:</strong> ${booking.occupancy.toLowerCase().replace(/_/g, " ")}<br>
            <strong>Where:</strong> ${[booking.addressLine1, booking.city, booking.postcode].filter(Boolean).join(", ")}<br>
            <strong>When:</strong> ${formatDate(booking.preferredDate)}${booking.datesFlexible ? " (flexible)" : ""} · ${booking.urgency.toLowerCase().replace(/_/g, " ")}<br>
            <strong>Access:</strong> ${booking.accessMethod.toLowerCase().replace(/_/g, " ")}</p>
            ${booking.customBrief ? `<p><strong>Their description:</strong><br>${booking.customBrief}</p>` : ""}
            ${booking.notes ? `<p><strong>Notes:</strong><br>${booking.notes}</p>` : ""}
            ${booking.parkingNotes ? `<p><strong>Parking:</strong> ${booking.parkingNotes}</p>` : ""}
            ${booking.allergyNotes ? `<p><strong>Allergies / products:</strong> ${booking.allergyNotes}</p>` : ""}
            ${booking.petsOnSite ? `<p>Pets on site.</p>` : ""}
          `,
          cta: { label: "Open in the dashboard", url: `${SITE.url}/admin/bookings/${booking.id}` },
        }),
      }).then(() => prisma.booking.update({ where: { id: booking.id }, data: { adminEmailSentAt: new Date() } })),
    );
  }

  if (settings.forwardBookingsToWhatsapp && settings.whatsappForwardNumber) {
    const summary = [
      `New booking ${booking.reference}`,
      `${booking.contactName} — ${booking.contactPhone}`,
      serviceList,
      `${booking.postcode} · ${formatDate(booking.preferredDate)}`,
      `Condition: ${booking.condition.toLowerCase().replace(/_/g, " ")}`,
      `${SITE.url}/admin/bookings/${booking.id}`,
    ].join("\n");

    notifications.push(
      forwardToWhatsApp({ to: settings.whatsappForwardNumber, message: summary, bookingId: booking.id }).then((r) =>
        r.ok
          ? prisma.booking.update({ where: { id: booking.id }, data: { whatsappForwardedAt: new Date() } })
          : undefined,
      ),
    );
  }

  // Notifications must never block or fail the booking itself.
  await Promise.allSettled(notifications);

  revalidatePath("/admin");
  revalidatePath("/admin/bookings");
  if (session) revalidatePath("/dashboard");

  return NextResponse.json({ reference: booking.reference, id: booking.id }, { status: 201 });
}
