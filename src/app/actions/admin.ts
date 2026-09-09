"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { serviceSchema, settingsSchema, messageSchema } from "@/lib/validations";
import { sendEmail, emailShell } from "@/lib/email";
import { forwardToWhatsApp } from "@/lib/whatsapp";
import { SITE } from "@/lib/constants";
import { formatMoney, slugify } from "@/lib/utils";

export type ActionState = { ok?: boolean; message?: string; error?: string; fieldErrors?: Record<string, string> };

function collect(issues: { path: (string | number)[]; message: string }[]) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}

const lines = (value: FormDataEntryValue | null) =>
  String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

// ---------------------------------------------------------------- services

export async function saveServiceAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "");
  const rawPrice = String(formData.get("price") ?? "").trim();

  const parsed = serviceSchema.safeParse({
    name,
    slug: String(formData.get("slug") ?? "") || slugify(name),
    summary: String(formData.get("summary") ?? ""),
    body: String(formData.get("body") ?? ""),
    group: String(formData.get("group") ?? "SIGNATURE"),
    propertyKind: String(formData.get("propertyKind") ?? "HOUSE"),
    priceMode: String(formData.get("priceMode") ?? "QUOTE_ONLY"),
    price: rawPrice === "" ? null : Number(rawPrice),
    negotiable: formData.get("negotiable") === "on",
    minimumCharge: String(formData.get("minimumCharge") ?? ""),
    includes: lines(formData.get("includes")),
    excludes: lines(formData.get("excludes")),
    durationEstimate: String(formData.get("durationEstimate") ?? ""),
    noticeHours: Number(formData.get("noticeHours") ?? 48),
    requiresSurvey: formData.get("requiresSurvey") === "on",
    photosRecommended: formData.get("photosRecommended") === "on",
    heroImage: String(formData.get("heroImage") ?? ""),
    whatsappPrompt: String(formData.get("whatsappPrompt") ?? ""),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 100),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
  });

  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: collect(parsed.error.issues) };

  const extras = lines(formData.get("extras")).map((line) => ({ name: line }));
  const d = parsed.data;

  const data = {
    name: d.name,
    slug: d.slug,
    summary: d.summary,
    body: d.body,
    group: d.group,
    propertyKind: d.propertyKind,
    priceMode: d.priceMode,
    price: d.price != null ? new Prisma.Decimal(d.price) : null,
    negotiable: d.negotiable,
    minimumCharge: d.minimumCharge || null,
    includes: d.includes,
    excludes: d.excludes,
    extras,
    durationEstimate: d.durationEstimate || null,
    noticeHours: d.noticeHours,
    requiresSurvey: d.requiresSurvey,
    photosRecommended: d.photosRecommended,
    heroImage: d.heroImage || null,
    whatsappPrompt: d.whatsappPrompt || null,
    featured: d.featured,
    active: d.active,
    sortOrder: d.sortOrder,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
  };

  try {
    if (id) await prisma.service.update({ where: { id }, data });
    else await prisma.service.create({ data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { error: "That web address is already used by another service.", fieldErrors: { slug: "Pick a different address" } };
    }
    throw error;
  }

  revalidatePath("/services");
  revalidatePath(`/services/${d.slug}`);
  revalidatePath("/admin/services");
  revalidatePath("/");
  return { ok: true, message: id ? "Service updated." : "Service created." };
}

export async function deleteServiceAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  // Soft delete: past bookings keep their snapshot either way, but keeping
  // the row means a service can be brought back without retyping it.
  await prisma.service.update({ where: { id }, data: { active: false } });
  revalidatePath("/admin/services");
  revalidatePath("/services");
}

// ---------------------------------------------------------------- bookings

export async function updateBookingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing booking." };

  const status = String(formData.get("status") ?? "") as
    | "IN_REVIEW" | "INFO_NEEDED" | "QUOTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "DECLINED";
  const rawQuote = String(formData.get("quotedTotal") ?? "").trim();
  const quoteNotes = String(formData.get("quoteNotes") ?? "");
  const adminNotes = String(formData.get("adminNotes") ?? "");
  const notify = formData.get("notifyCustomer") === "on";

  const before = await prisma.booking.findUnique({ where: { id } });
  if (!before) return { error: "That booking no longer exists." };

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      status,
      quotedTotal: rawQuote === "" ? null : new Prisma.Decimal(Number(rawQuote)),
      quoteNotes: quoteNotes || null,
      adminNotes: adminNotes || null,
      events: {
        create: {
          label: before.status === status ? "Booking updated" : `Status changed to ${status.toLowerCase().replace(/_/g, " ")}`,
          detail: rawQuote ? `Quote set to ${formatMoney(Number(rawQuote))}` : undefined,
          actor: admin.email,
        },
      },
    },
  });

  if (notify) {
    const heading =
      status === "QUOTED"
        ? "Your price is ready"
        : status === "CONFIRMED"
          ? "You're in the diary"
          : status === "INFO_NEEDED"
            ? "We need a little more from you"
            : "An update on your booking";

    await sendEmail({
      to: booking.contactEmail,
      bookingId: booking.id,
      recipientId: booking.userId ?? undefined,
      senderId: admin.id,
      subject: `${heading} — ${booking.reference}`,
      html: emailShell({
        heading,
        body: `
          <p>Hello ${booking.contactName.split(" ")[0]},</p>
          ${booking.quotedTotal ? `<p><strong>Your price: ${formatMoney(Number(booking.quotedTotal))}</strong></p>` : ""}
          ${quoteNotes ? `<p>${quoteNotes.replace(/\n/g, "<br>")}</p>` : ""}
          <p>Your reference is ${booking.reference}. Reply to this email or message us on WhatsApp if anything needs changing.</p>
        `,
        cta: { label: "View your booking", url: `${SITE.url}/dashboard` },
      }),
    });
  }

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/dashboard");
  return { ok: true, message: notify ? "Booking updated and the customer has been emailed." : "Booking updated." };
}

export async function forwardBookingToWhatsAppAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "");
  if (!id || !to) return;

  const booking = await prisma.booking.findUnique({ where: { id }, include: { items: true } });
  if (!booking) return;

  const message = [
    `Booking ${booking.reference}`,
    `${booking.contactName} — ${booking.contactPhone}`,
    booking.items.map((i) => i.nameSnapshot).join(", ") || "Custom job",
    `${booking.postcode} · ${booking.preferredDate.toISOString().slice(0, 10)}`,
  ].join("\n");

  const result = await forwardToWhatsApp({ to, message, bookingId: id });
  if (result.ok) {
    await prisma.booking.update({ where: { id }, data: { whatsappForwardedAt: new Date() } });
  }
  revalidatePath(`/admin/bookings/${id}`);
}

// ---------------------------------------------------------------- messages

export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();

  const parsed = messageSchema.safeParse({
    recipientId: String(formData.get("recipientId") ?? "") || undefined,
    bookingId: String(formData.get("bookingId") ?? "") || undefined,
    toAddress: String(formData.get("toAddress") ?? ""),
    channel: String(formData.get("channel") ?? "EMAIL"),
    subject: String(formData.get("subject") ?? ""),
    body: String(formData.get("body") ?? ""),
  });

  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: collect(parsed.error.issues) };
  const d = parsed.data;

  if (d.channel === "INTERNAL_NOTE") {
    await prisma.messageLog.create({
      data: { channel: "INTERNAL_NOTE", status: "SENT", toAddress: d.toAddress, subject: d.subject || null, body: d.body, senderId: admin.id, recipientId: d.recipientId, bookingId: d.bookingId, sentAt: new Date() },
    });
    revalidatePath("/admin/messages");
    return { ok: true, message: "Note saved." };
  }

  if (d.channel === "WHATSAPP") {
    const result = await forwardToWhatsApp({ to: d.toAddress, message: d.body, bookingId: d.bookingId });
    revalidatePath("/admin/messages");
    return result.ok
      ? { ok: true, message: "WhatsApp message sent." }
      : { ok: true, message: "WhatsApp isn't connected, so we've saved a one-tap link on the message log instead." };
  }

  const result = await sendEmail({
    to: d.toAddress,
    subject: d.subject || `A message from ${SITE.name}`,
    recipientId: d.recipientId,
    senderId: admin.id,
    bookingId: d.bookingId,
    html: emailShell({
      heading: d.subject || `A message from ${SITE.name}`,
      body: d.body.replace(/\n/g, "<br>"),
    }),
  });

  revalidatePath("/admin/messages");
  if (result.skipped) return { ok: true, message: "Saved. No mail server is connected yet, so nothing was sent." };
  return result.ok ? { ok: true, message: "Email sent." } : { error: "The mail server rejected that. Check the message log." };
}

// ---------------------------------------------------------------- settings

export async function saveSettingsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();

  const parsed = settingsSchema.safeParse({
    businessName: String(formData.get("businessName") ?? ""),
    tagline: String(formData.get("tagline") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    whatsapp: String(formData.get("whatsapp") ?? ""),
    email: String(formData.get("email") ?? ""),
    serviceAreas: lines(formData.get("serviceAreas")),
    openingHours: String(formData.get("openingHours") ?? ""),
    responsePromise: String(formData.get("responsePromise") ?? ""),
    quoteWindow: String(formData.get("quoteWindow") ?? ""),
    bookingFeeNote: String(formData.get("bookingFeeNote") ?? ""),
    cancellationHours: Number(formData.get("cancellationHours") ?? 72),
    reclaimWindowHours: Number(formData.get("reclaimWindowHours") ?? 15),
    emailBookingToAdmin: formData.get("emailBookingToAdmin") === "on",
    emailBookingToCustomer: formData.get("emailBookingToCustomer") === "on",
    forwardBookingsToWhatsapp: formData.get("forwardBookingsToWhatsapp") === "on",
    whatsappForwardNumber: String(formData.get("whatsappForwardNumber") ?? ""),
    adminNotifyEmail: String(formData.get("adminNotifyEmail") ?? ""),
    adminNotifyCc: String(formData.get("adminNotifyCc") ?? ""),
    announcementText: String(formData.get("announcementText") ?? ""),
    announcementActive: formData.get("announcementActive") === "on",
    googleReviewUrl: String(formData.get("googleReviewUrl") ?? ""),
    facebookUrl: String(formData.get("facebookUrl") ?? ""),
    instagramUrl: String(formData.get("instagramUrl") ?? ""),
    tiktokUrl: String(formData.get("tiktokUrl") ?? ""),
  });

  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: collect(parsed.error.issues) };
  const d = parsed.data;

  if (d.forwardBookingsToWhatsapp && !d.whatsappForwardNumber) {
    return {
      error: "Add the number bookings should be forwarded to.",
      fieldErrors: { whatsappForwardNumber: "Required while forwarding is switched on" },
    };
  }

  const payload = {
    ...d,
    whatsappForwardNumber: d.whatsappForwardNumber || null,
    adminNotifyCc: d.adminNotifyCc || null,
    announcementText: d.announcementText || null,
    googleReviewUrl: d.googleReviewUrl || null,
    facebookUrl: d.facebookUrl || null,
    instagramUrl: d.instagramUrl || null,
    tiktokUrl: d.tiktokUrl || null,
  };

  await prisma.siteSetting.upsert({
    where: { id: "singleton" },
    create: { id: "singleton", ...payload },
    update: payload,
  });

  revalidateTag("site-settings");
  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved." };
}
