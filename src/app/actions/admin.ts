"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { deletePublicObject } from "@/lib/r2";
import {
  serviceSchema,
  settingsSchema,
  messageSchema,
  galleryJobSchema,
  inboxUploadSchema,
  inboxIdsSchema,
  inboxReturnSchema,
  adminReviewSchema,
  PLACEHOLDER_REVIEW_PREFIX,
} from "@/lib/validations";
import { MAX_FRAMES_PER_JOB, displayNameFromKey } from "@/lib/gallery";
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

/** The form serialises repeatable groups (extras, FAQs, gallery images) as a hidden JSON input. */
function json(value: FormDataEntryValue | null): unknown[] {
  try {
    const parsed = JSON.parse(String(value ?? "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

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
    extras: json(formData.get("extrasJson")),
    durationEstimate: String(formData.get("durationEstimate") ?? ""),
    noticeHours: Number(formData.get("noticeHours") ?? 48),
    requiresSurvey: formData.get("requiresSurvey") === "on",
    photosRecommended: formData.get("photosRecommended") === "on",
    icon: String(formData.get("icon") ?? ""),
    tags: json(formData.get("tagsJson")),
    heroImage: String(formData.get("heroImage") ?? ""),
    images: json(formData.get("imagesJson")),
    faqs: json(formData.get("faqsJson")),
    whatsappPrompt: String(formData.get("whatsappPrompt") ?? ""),
    featured: formData.get("featured") === "on",
    active: formData.get("active") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 100),
    seoTitle: String(formData.get("seoTitle") ?? ""),
    seoDescription: String(formData.get("seoDescription") ?? ""),
  });

  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: collect(parsed.error.issues) };

  const d = parsed.data;
  const images = d.images.map((image, index) => ({
    url: image.url,
    alt: image.alt || d.name,
    caption: image.caption || null,
    sortOrder: index * 10,
  }));

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
    extras: d.extras.map((extra) => ({ name: extra.name, note: extra.note || undefined })),
    durationEstimate: d.durationEstimate || null,
    noticeHours: d.noticeHours,
    requiresSurvey: d.requiresSurvey,
    photosRecommended: d.photosRecommended,
    icon: d.icon || null,
    tags: d.tags,
    heroImage: d.heroImage || null,
    whatsappPrompt: d.whatsappPrompt || null,
    featured: d.featured,
    active: d.active,
    sortOrder: d.sortOrder,
    seoTitle: d.seoTitle || null,
    seoDescription: d.seoDescription || null,
    faqs: d.faqs.length > 0 ? d.faqs : Prisma.JsonNull,
  };

  try {
    if (id) {
      await prisma.service.update({
        where: { id },
        data: { ...data, images: { deleteMany: {}, create: images } },
      });
    } else {
      await prisma.service.create({ data: { ...data, images: { create: images } } });
    }
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

// ---------------------------------------------------------------- gallery

type GallerySlotInput = { type: "PHOTO" | "VIDEO"; key: string; poster?: string | null; width?: number | null; height?: number | null; alt?: string };

function frameKeys(frame: { primaryKey: string; primaryPoster: string | null; secondaryKey: string | null; secondaryPoster: string | null }) {
  return [frame.primaryKey, frame.primaryPoster, frame.secondaryKey, frame.secondaryPoster].filter((k): k is string => Boolean(k));
}

/**
 * Deletes R2 objects that nothing points at any more. Checking every key first
 * means a file that moved to the inbox or another job is never deleted from
 * under it. Best effort: a failed delete leaves an orphan, never a broken page.
 */
async function deleteUnreferencedObjects(keys: string[]) {
  if (keys.length === 0) return;
  const [media, inbox] = await Promise.all([
    prisma.galleryMedia.findMany({
      where: {
        OR: [
          { primaryKey: { in: keys } },
          { primaryPoster: { in: keys } },
          { secondaryKey: { in: keys } },
          { secondaryPoster: { in: keys } },
        ],
      },
      select: { primaryKey: true, primaryPoster: true, secondaryKey: true, secondaryPoster: true },
    }),
    prisma.galleryInboxItem.findMany({
      where: { OR: [{ key: { in: keys } }, { poster: { in: keys } }] },
      select: { key: true, poster: true },
    }),
  ]);
  const live = new Set([...media.flatMap(frameKeys), ...inbox.flatMap((i) => [i.key, i.poster])].filter(Boolean));
  await Promise.all(keys.filter((key) => !live.has(key)).map((key) => deletePublicObject(key)));
}

type InboxRow = { type: "PHOTO" | "VIDEO"; key: string; poster: string | null; width: number | null; height: number | null };

function frameFromInbox(item: InboxRow, sortOrder: number) {
  return {
    layout: "SINGLE" as const,
    primaryType: item.type,
    primaryKey: item.key,
    primaryPoster: item.poster,
    primaryWidth: item.width,
    primaryHeight: item.height,
    sortOrder,
  };
}

function revalidateGallery() {
  revalidatePath("/gallery");
  revalidatePath("/services/[slug]", "page");
  revalidatePath("/");
  revalidatePath("/admin/gallery");
}

export async function saveGalleryJobAction(_prev: ActionState, formData: FormData): Promise<ActionState & { id?: string }> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = galleryJobSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    completedOn: String(formData.get("completedOn") ?? ""),
    area: String(formData.get("area") ?? ""),
    serviceId: String(formData.get("serviceId") ?? ""),
    published: formData.get("published") === "on",
    featured: formData.get("featured") === "on",
    media: json(formData.get("mediaJson")),
  });

  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: collect(parsed.error.issues) };
  const d = parsed.data;

  if (d.serviceId) {
    const exists = await prisma.service.findUnique({ where: { id: d.serviceId }, select: { id: true } });
    if (!exists) return { error: "That service no longer exists.", fieldErrors: { serviceId: "Pick another service" } };
  }

  const slot = (s: GallerySlotInput | null | undefined) => ({
    type: s?.type ?? null,
    key: s?.key ?? null,
    poster: s?.type === "VIDEO" ? (s.poster ?? null) : null,
    width: s?.width ?? null,
    height: s?.height ?? null,
    alt: s?.alt ?? "",
  });

  const media = d.media.map((frame, index) => {
    const p = slot(frame.primary);
    const s = slot(frame.layout === "BEFORE_AFTER" ? frame.secondary : null);
    return {
      layout: frame.layout,
      primaryType: frame.primary.type,
      primaryKey: frame.primary.key,
      primaryPoster: p.poster,
      primaryWidth: p.width,
      primaryHeight: p.height,
      primaryAlt: p.alt,
      secondaryType: s.type,
      secondaryKey: s.key,
      secondaryPoster: s.poster,
      secondaryWidth: s.width,
      secondaryHeight: s.height,
      secondaryAlt: s.alt,
      caption: frame.caption || null,
      sortOrder: index * 10,
    };
  });

  const data = {
    title: d.title || null,
    description: d.description || null,
    completedOn: d.completedOn ? new Date(`${d.completedOn}T00:00:00.000Z`) : null,
    area: d.area || null,
    serviceId: d.serviceId || null,
    published: d.published,
    featured: d.featured,
  };

  let savedId = id;
  let removedKeys: string[] = [];
  const kept = new Set(media.flatMap(frameKeys));

  if (id) {
    const before = await prisma.galleryMedia.findMany({ where: { jobId: id } });
    removedKeys = before.flatMap(frameKeys).filter((key) => !kept.has(key));
    try {
      await prisma.galleryJob.update({ where: { id }, data: { ...data, media: { deleteMany: {}, create: media } } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return { error: "That job no longer exists." };
      }
      throw error;
    }
  } else {
    const created = await prisma.galleryJob.create({ data: { ...data, media: { create: media } }, select: { id: true } });
    savedId = created.id;
  }

  // Files sent back to the inbox leave the job but keep their R2 object. One
  // still used by another job stays where it is rather than being adopted.
  const returned = inboxReturnSchema.safeParse(json(formData.get("inboxJson")));
  const toInbox = returned.success ? returned.data.filter((s) => !kept.has(s.key)) : [];
  if (toInbox.length > 0) {
    const keys = toInbox.map((s) => s.key);
    const inUse = await prisma.galleryMedia.findMany({
      where: { OR: [{ primaryKey: { in: keys } }, { secondaryKey: { in: keys } }] },
      select: { primaryKey: true, secondaryKey: true },
    });
    const used = new Set(inUse.flatMap((m) => [m.primaryKey, m.secondaryKey]));
    await prisma.galleryInboxItem.createMany({
      data: toInbox
        .filter((s) => !used.has(s.key))
        .map((s) => ({
          type: s.type,
          key: s.key,
          poster: s.type === "VIDEO" ? (s.poster ?? null) : null,
          width: s.width ?? null,
          height: s.height ?? null,
          originalName: displayNameFromKey(s.key),
        })),
      skipDuplicates: true,
    });
  }

  await deleteUnreferencedObjects(removedKeys);
  revalidateGallery();

  const status = d.published ? "It's live on the gallery." : "Saved as a draft — it isn't on the website yet.";
  return { ok: true, id: savedId, message: `${id ? "Job updated" : "Job created"}. ${status}` };
}

export async function setGalleryJobPublishedAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const published = formData.get("published") === "true";
  if (!id) return;
  // Publishing an empty job would show a blank card, so only allow it with media.
  await prisma.galleryJob.updateMany({
    where: { id, ...(published ? { media: { some: {} } } : {}) },
    data: { published },
  });
  revalidateGallery();
}

export async function deleteGalleryJobAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const media = await prisma.galleryMedia.findMany({ where: { jobId: id } });
  // Hard delete: nothing else references a gallery job, unlike a service.
  await prisma.galleryJob.delete({ where: { id } }).catch(() => null);
  await deleteUnreferencedObjects(media.flatMap(frameKeys));
  revalidateGallery();
  redirect("/admin/gallery");
}

// ---------------------------------------------------------------- gallery inbox

type InboxResult = { ok: true; id?: string; count?: number } | { ok: false; error: string };

/** Called once per finished upload, so a half-finished batch is never lost. */
export async function addInboxItemAction(input: unknown): Promise<InboxResult> {
  await requireAdmin();
  const parsed = inboxUploadSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "That upload couldn't be recorded." };
  const s = parsed.data;
  try {
    const row = await prisma.galleryInboxItem.create({
      data: {
        type: s.type,
        key: s.key,
        poster: s.type === "VIDEO" ? (s.poster ?? null) : null,
        width: s.width ?? null,
        height: s.height ?? null,
        originalName: s.originalName || displayNameFromKey(s.key),
      },
      select: { id: true },
    });
    return { ok: true, id: row.id };
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, error: "That file is already in the inbox." };
    }
    throw error;
  }
}

/** Takes the chosen files out of the inbox; fails if any were claimed in the meantime. */
async function claimInboxItems(tx: Prisma.TransactionClient, ids: string[]) {
  const items = await tx.galleryInboxItem.findMany({
    where: { id: { in: ids } },
    orderBy: [{ originalName: "asc" }, { createdAt: "asc" }],
  });
  const { count } = await tx.galleryInboxItem.deleteMany({ where: { id: { in: items.map((i) => i.id) } } });
  if (items.length === 0 || count !== items.length) throw new InboxConflict();
  return items;
}

class InboxConflict extends Error {}

const INBOX_CONFLICT = "Some of those files have already been moved. Refresh the inbox and try again.";

export async function createJobFromInboxAction(input: unknown): Promise<InboxResult> {
  await requireAdmin();
  const parsed = inboxIdsSchema.max(MAX_FRAMES_PER_JOB).safeParse(input);
  if (!parsed.success) return { ok: false, error: `Pick between 1 and ${MAX_FRAMES_PER_JOB} files for one job.` };

  try {
    const job = await prisma.$transaction(async (tx) => {
      const items = await claimInboxItems(tx, parsed.data);
      return tx.galleryJob.create({
        data: { media: { create: items.map((item, index) => frameFromInbox(item, index * 10)) } },
        select: { id: true },
      });
    });
    return { ok: true, id: job.id };
  } catch (error) {
    if (error instanceof InboxConflict) return { ok: false, error: INBOX_CONFLICT };
    throw error;
  }
}

export async function addInboxToJobAction(input: unknown, jobId: unknown): Promise<InboxResult> {
  await requireAdmin();
  const parsed = inboxIdsSchema.safeParse(input);
  if (!parsed.success || typeof jobId !== "string") return { ok: false, error: "Pick some files and a job." };

  const job = await prisma.galleryJob.findUnique({
    where: { id: jobId },
    select: {
      published: true,
      _count: { select: { media: true } },
      media: { orderBy: { sortOrder: "desc" }, take: 1, select: { sortOrder: true } },
    },
  });
  if (!job) return { ok: false, error: "That job no longer exists." };

  const room = MAX_FRAMES_PER_JOB - job._count.media;
  if (parsed.data.length > room) {
    return { ok: false, error: room > 0 ? `That job only has room for ${room} more.` : "That job is full." };
  }

  const start = job.media[0]?.sortOrder ?? 0;
  try {
    const count = await prisma.$transaction(async (tx) => {
      const items = await claimInboxItems(tx, parsed.data);
      await tx.galleryMedia.createMany({
        data: items.map((item, index) => ({ jobId, ...frameFromInbox(item, start + (index + 1) * 10) })),
      });
      return items.length;
    });
    if (job.published) revalidateGallery();
    return { ok: true, count };
  } catch (error) {
    if (error instanceof InboxConflict) return { ok: false, error: INBOX_CONFLICT };
    throw error;
  }
}

export async function deleteInboxItemsAction(input: unknown): Promise<InboxResult> {
  await requireAdmin();
  const parsed = inboxIdsSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Pick some files to delete." };
  const items = await prisma.galleryInboxItem.findMany({ where: { id: { in: parsed.data } } });
  await prisma.galleryInboxItem.deleteMany({ where: { id: { in: items.map((i) => i.id) } } });
  await deleteUnreferencedObjects(items.flatMap((i) => [i.key, i.poster]).filter((k): k is string => Boolean(k)));
  return { ok: true, count: items.length };
}

// ---------------------------------------------------------------- reviews

function revalidateReviews() {
  revalidatePath("/");
  revalidatePath("/reviews");
  revalidatePath("/gallery");
  revalidatePath("/admin/reviews");
}

export async function saveReviewAction(_prev: ActionState, formData: FormData): Promise<ActionState & { id?: string }> {
  await requireAdmin();

  const id = String(formData.get("id") ?? "");
  const parsed = adminReviewSchema.safeParse({
    authorName: String(formData.get("authorName") ?? ""),
    area: String(formData.get("area") ?? ""),
    rating: String(formData.get("rating") ?? ""),
    body: String(formData.get("body") ?? ""),
    source: String(formData.get("source") ?? "GOOGLE"),
    status: String(formData.get("status") ?? "PENDING"),
    jobId: String(formData.get("jobId") ?? ""),
    featured: formData.get("featured") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 100),
  });

  if (!parsed.success) return { error: "Please check the highlighted fields.", fieldErrors: collect(parsed.error.issues) };
  const d = parsed.data;

  if (d.jobId) {
    const exists = await prisma.galleryJob.findUnique({ where: { id: d.jobId }, select: { id: true } });
    if (!exists) return { error: "That gallery job no longer exists.", fieldErrors: { jobId: "Pick another job" } };
  }

  const data = { ...d, area: d.area || null, jobId: d.jobId || null };

  let savedId = id;
  if (id) {
    try {
      await prisma.testimonial.update({ where: { id }, data });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
        return { error: "That review no longer exists." };
      }
      throw error;
    }
  } else {
    savedId = (await prisma.testimonial.create({ data, select: { id: true } })).id;
  }

  revalidateReviews();
  const status = d.status === "APPROVED" ? "It's live on the website." : "It isn't on the website.";
  return { ok: true, id: savedId, message: `${id ? "Review updated" : "Review added"}. ${status}` };
}

export async function setReviewStatusAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || (status !== "APPROVED" && status !== "HIDDEN" && status !== "PENDING")) return;
  await prisma.testimonial.updateMany({
    // Same guard as the edit form: a seeded placeholder can never go live.
    where: { id, ...(status === "APPROVED" ? { NOT: { body: { startsWith: PLACEHOLDER_REVIEW_PREFIX } } } : {}) },
    data: { status },
  });
  revalidateReviews();
}

export async function deleteReviewAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await prisma.testimonial.delete({ where: { id } }).catch(() => null);
  revalidateReviews();
  redirect("/admin/reviews");
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
  if (result.skipped) return { ok: true, message: "Saved. No email service is connected yet, so nothing was sent." };
  return result.ok ? { ok: true, message: "Email sent." } : { error: "The email service rejected that. Check the message log." };
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
    emailReviewToAdmin: formData.get("emailReviewToAdmin") === "on",
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
