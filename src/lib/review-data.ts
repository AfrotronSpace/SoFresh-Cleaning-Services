import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { jobTitle } from "@/lib/gallery-data";
import { REVIEWS_PAGE_SIZE, type PublicReview } from "@/lib/reviews";

export const reviewJobInclude = {
  job: { select: { id: true, title: true, published: true, service: { select: { name: true } } } },
} satisfies Prisma.TestimonialInclude;

type ReviewRow = Prisma.TestimonialGetPayload<{ include: typeof reviewJobInclude }>;

const publicOrder = [{ featured: "desc" }, { sortOrder: "asc" }, { createdAt: "desc" }] satisfies Prisma.TestimonialOrderByWithRelationInput[];

export function toPublicReview(r: ReviewRow): PublicReview {
  return {
    id: r.id,
    authorName: r.authorName,
    area: r.area,
    body: r.body,
    rating: r.rating,
    source: r.source,
    // A review stays up if its job is taken off the gallery; only the link goes.
    job: r.job?.published ? { id: r.job.id, title: jobTitle(r.job) } : null,
  };
}

/** Approved reviews, paginated, plus the overall average. Swallows database errors so pages still render. */
export async function getApprovedReviews(opts: { page?: number; take?: number } = {}) {
  const take = opts.take ?? REVIEWS_PAGE_SIZE;
  const page = Math.max(1, opts.page ?? 1);
  const where = { status: "APPROVED" } satisfies Prisma.TestimonialWhereInput;

  try {
    const [rows, stats] = await Promise.all([
      prisma.testimonial.findMany({ where, include: reviewJobInclude, orderBy: publicOrder, skip: (page - 1) * take, take }),
      prisma.testimonial.aggregate({ where, _count: true, _avg: { rating: true } }),
    ]);
    return {
      reviews: rows.map(toPublicReview),
      total: stats._count,
      average: stats._avg.rating,
      page,
      pageCount: Math.max(1, Math.ceil(stats._count / take)),
    };
  } catch {
    return { reviews: [] as PublicReview[], total: 0, average: null, page, pageCount: 1 };
  }
}

/** Every gallery job, drafts included, for the admin's "link to a job" picker. */
export async function getJobOptions() {
  const jobs = await prisma.galleryJob.findMany({
    orderBy: [{ completedOn: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: 500,
    select: { id: true, title: true, area: true, published: true, service: { select: { name: true } } },
  });
  return jobs.map((j) => ({
    id: j.id,
    label: [jobTitle(j), j.area, !j.published && "(draft)"].filter(Boolean).join(" · "),
  }));
}

/** A published job a customer can attach their review to, for /reviews?job=. */
export async function getReviewableJob(id: string) {
  return prisma.galleryJob
    .findFirst({ where: { id, published: true }, select: { id: true, title: true, service: { select: { name: true } } } })
    .then((job) => (job ? { id: job.id, title: jobTitle(job) } : null))
    .catch(() => null);
}
