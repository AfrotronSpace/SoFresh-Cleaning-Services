import type { GalleryJob, GalleryMedia, MediaType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { publicObjectUrl } from "@/lib/r2";
import { formatDate } from "@/lib/utils";
import {
  GALLERY_PAGE_SIZE,
  displayNameFromKey,
  type EditorFrame,
  type EditorSlot,
  type InboxItem,
  type PublicFrame,
  type PublicJob,
  type PublicSlot,
} from "@/lib/gallery";

type JobWithMedia = GalleryJob & { media: GalleryMedia[]; service: { slug: string; name: string } | null };

const mediaInclude = {
  media: { orderBy: { sortOrder: "asc" } },
  service: { select: { slug: true, name: true } },
} satisfies Prisma.GalleryJobInclude;

const publicOrder = [
  { featured: "desc" },
  { completedOn: { sort: "desc", nulls: "last" } },
  { createdAt: "desc" },
] satisfies Prisma.GalleryJobOrderByWithRelationInput[];

type SlotColumns = { type: MediaType | null; key: string | null; poster: string | null; width: number | null; height: number | null; alt: string };

function slotColumns(m: GalleryMedia, side: "primary" | "secondary"): SlotColumns {
  return side === "primary"
    ? { type: m.primaryType, key: m.primaryKey, poster: m.primaryPoster, width: m.primaryWidth, height: m.primaryHeight, alt: m.primaryAlt }
    : { type: m.secondaryType, key: m.secondaryKey, poster: m.secondaryPoster, width: m.secondaryWidth, height: m.secondaryHeight, alt: m.secondaryAlt };
}

export function jobTitle(job: { title: string | null; service: { name: string } | null }) {
  return job.title || job.service?.name || "Completed job";
}

export function toPublicJob(job: JobWithMedia): PublicJob | null {
  const title = jobTitle(job);
  const frames: PublicFrame[] = [];

  for (const [index, m] of job.media.entries()) {
    const slot = (side: "primary" | "secondary", fallbackAlt: string): PublicSlot | null => {
      const c = slotColumns(m, side);
      const url = c.key ? publicObjectUrl(c.key) : null;
      if (!c.type || !url) return null;
      return {
        type: c.type,
        url,
        poster: c.poster ? publicObjectUrl(c.poster) : null,
        width: c.width,
        height: c.height,
        alt: c.alt || fallbackAlt,
      };
    };

    const pair = m.layout === "BEFORE_AFTER";
    const primary = slot("primary", pair ? `${title}, before cleaning` : `${title}, photo ${index + 1}`);
    if (!primary) continue;
    const secondary = pair ? slot("secondary", `${title}, after cleaning`) : null;
    if (pair && !secondary) continue;

    frames.push({ id: m.id, layout: m.layout, primary, secondary, caption: m.caption });
  }

  if (frames.length === 0) return null;

  return {
    id: job.id,
    title,
    description: job.description,
    dateLabel: job.completedOn ? formatDate(job.completedOn, { day: undefined, timeZone: "UTC" }) : null,
    area: job.area,
    service: job.service,
    frames,
  };
}

/** Published jobs for /gallery. Swallows database errors so the page still renders. */
export async function getPublishedJobs(opts: { serviceSlug?: string; page?: number } = {}) {
  const page = Math.max(1, opts.page ?? 1);
  const where: Prisma.GalleryJobWhereInput = {
    published: true,
    media: { some: {} },
    ...(opts.serviceSlug ? { service: { slug: opts.serviceSlug } } : {}),
  };

  try {
    const [rows, total] = await Promise.all([
      prisma.galleryJob.findMany({
        where,
        include: mediaInclude,
        orderBy: publicOrder,
        skip: (page - 1) * GALLERY_PAGE_SIZE,
        take: GALLERY_PAGE_SIZE,
      }),
      prisma.galleryJob.count({ where }),
    ]);
    return {
      jobs: rows.map(toPublicJob).filter((j): j is PublicJob => j !== null),
      page,
      pageCount: Math.max(1, Math.ceil(total / GALLERY_PAGE_SIZE)),
      total,
    };
  } catch {
    return { jobs: [] as PublicJob[], page, pageCount: 1, total: 0 };
  }
}

/** One live job, for a ?job= deep link that isn't on the current page. */
export async function getPublishedJob(id: string) {
  return prisma.galleryJob
    .findFirst({ where: { id, published: true }, include: mediaInclude })
    .then((job) => (job ? toPublicJob(job) : null))
    .catch(() => null);
}

/** Services that have at least one live job — the filter chips on /gallery. */
export async function getGalleryServiceFilters() {
  return prisma.service
    .findMany({
      where: { active: true, galleryJobs: { some: { published: true, media: { some: {} } } } },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    })
    .catch(() => [] as { slug: string; name: string }[]);
}

export async function getServiceJobs(serviceId: string, take = 4) {
  return prisma.galleryJob
    .findMany({ where: { serviceId, published: true, media: { some: {} } }, include: mediaInclude, orderBy: publicOrder, take })
    .then((rows) => rows.map(toPublicJob).filter((j): j is PublicJob => j !== null))
    .catch(() => [] as PublicJob[]);
}

/**
 * The homepage showcase: the most recent featured before/after where both
 * sides are photos — from `preferServiceSlug` if one exists, otherwise any service.
 */
export async function getShowcasePair(preferServiceSlug?: string) {
  const find = (serviceSlug?: string) =>
    prisma.galleryMedia.findFirst({
      where: {
        layout: "BEFORE_AFTER",
        primaryType: "PHOTO",
        secondaryType: "PHOTO",
        job: { published: true, featured: true, ...(serviceSlug ? { service: { slug: serviceSlug } } : {}) },
      },
      orderBy: [{ job: { completedOn: { sort: "desc", nulls: "last" } } }, { sortOrder: "asc" }],
      include: { job: { include: mediaInclude } },
    });

  try {
    const frame = (preferServiceSlug ? await find(preferServiceSlug) : null) ?? (await find());
    if (!frame) return null;
    const job = toPublicJob(frame.job);
    const match = job?.frames.find((f) => f.id === frame.id);
    return job && match?.secondary ? { job, frame: match as PublicFrame & { secondary: PublicSlot } } : null;
  } catch {
    return null;
  }
}

function editorSlot(c: SlotColumns): EditorSlot | null {
  if (!c.type || !c.key) return null;
  return {
    type: c.type,
    key: c.key,
    url: publicObjectUrl(c.key) ?? "",
    poster: c.poster,
    posterUrl: c.poster ? publicObjectUrl(c.poster) : null,
    width: c.width,
    height: c.height,
    alt: c.alt,
  };
}

export function toEditorFrames(media: GalleryMedia[]): EditorFrame[] {
  return media.flatMap((m) => {
    const primary = editorSlot(slotColumns(m, "primary"));
    if (!primary) return [];
    const secondary = m.layout === "BEFORE_AFTER" ? editorSlot(slotColumns(m, "secondary")) : null;
    return [{ layout: m.layout, primary, secondary, caption: m.caption ?? "" }];
  });
}

/** Everything waiting in the inbox, oldest WhatsApp name first. */
export async function getInboxItems(): Promise<InboxItem[]> {
  const rows = await prisma.galleryInboxItem.findMany({ orderBy: [{ originalName: "asc" }, { createdAt: "asc" }] });
  return rows.flatMap((r) => {
    const slot = editorSlot({ type: r.type, key: r.key, poster: r.poster, width: r.width, height: r.height, alt: "" });
    return slot ? [{ ...slot, id: r.id, name: r.originalName || displayNameFromKey(r.key) }] : [];
  });
}
