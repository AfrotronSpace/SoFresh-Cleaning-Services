import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Stars } from "@/components/site/stars";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { jobTitle } from "@/lib/gallery-data";
import { REVIEW_SOURCE, REVIEW_STATUS, type ReviewStatus } from "@/lib/reviews";
import { PLACEHOLDER_REVIEW_PREFIX } from "@/lib/validations";
import { setReviewStatusAction } from "@/app/actions/admin";
import { cn, formatDate, truncate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Reviews", robots: { index: false, follow: false } };

const FILTERS = [
  { key: "pending", label: "Waiting", status: "PENDING" },
  { key: "live", label: "Live", status: "APPROVED" },
  { key: "hidden", label: "Hidden", status: "HIDDEN" },
  { key: "all", label: "All", status: null },
] as const;

export default async function AdminReviewsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin("/admin/reviews");
  const { show } = await searchParams;

  const counts = await prisma.testimonial.groupBy({ by: ["status"], _count: true });
  const count = (s: ReviewStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const total = counts.reduce((n, c) => n + c._count, 0);

  // Land on the queue when there's something in it, otherwise on what's live.
  const fallback = count("PENDING") > 0 ? "pending" : "live";
  const filter = FILTERS.find((f) => f.key === show) ?? FILTERS.find((f) => f.key === fallback)!;

  const where: Prisma.TestimonialWhereInput = filter.status ? { status: filter.status } : {};
  const reviews = await prisma.testimonial.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
    take: 300,
    include: { job: { select: { id: true, title: true, service: { select: { name: true } } } } },
  });

  return (
    <>
      <PageHeader
        title="Reviews"
        description="Paste in reviews from your Google Business Profile, and approve the ones customers leave on the website. Nothing appears on the site until it's live."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/reviews" target="_blank">View reviews page</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/reviews/new">Add a Google review</Link>
            </Button>
          </div>
        }
      />

      {total > 0 && (
        <nav aria-label="Filter reviews" className="mb-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const n = f.status ? count(f.status) : total;
            return (
              <Link
                key={f.key}
                href={`/admin/reviews?show=${f.key}`}
                aria-current={filter.key === f.key ? "page" : undefined}
                className={cn(
                  "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                  filter.key === f.key ? "border-forest bg-forest text-white" : "border-border bg-white text-sage hover:text-forest",
                )}
              >
                {f.label} ({n})
              </Link>
            );
          })}
        </nav>
      )}

      {reviews.length === 0 ? (
        <EmptyState
          title={total === 0 ? "No reviews yet" : filter.key === "pending" ? "Nothing waiting" : "Nothing here"}
          body={
            total === 0
              ? "Copy your best Google reviews in here, and anything customers leave on the website will wait here for you to approve."
              : filter.key === "pending"
                ? "Every review has been dealt with. New ones from the website will show up here."
                : "No reviews match this filter."
          }
          action={
            total === 0 ? (
              <Button asChild>
                <Link href="/admin/reviews/new">Add a Google review</Link>
              </Button>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-4">
          {reviews.map((review) => {
            const placeholder = review.body.startsWith(PLACEHOLDER_REVIEW_PREFIX);
            const status = REVIEW_STATUS[review.status];
            return (
              <li key={review.id} className="rounded-2xl border border-border bg-white">
                <Link href={`/admin/reviews/${review.id}`} className="block p-6 transition-colors hover:bg-haze/60">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars rating={review.rating} />
                      <p className="font-medium text-ink">
                        {review.authorName}
                        {review.area ? <span className="font-normal text-sage">, {review.area}</span> : null}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {review.featured && <Badge variant="accent">Featured</Badge>}
                      <Badge variant="outline">{REVIEW_SOURCE[review.source]}</Badge>
                      <Badge variant={status.tone}>{status.label}</Badge>
                    </div>
                  </div>
                  <p className={cn("mt-3 text-[0.9375rem] leading-relaxed", placeholder ? "italic text-destructive" : "text-sage")}>
                    {truncate(review.body, 320)}
                  </p>
                  <p className="mt-3 text-sm text-sage">
                    {formatDate(review.createdAt)}
                    {review.email && ` · ${review.email}`}
                    {review.job && ` · Job: ${jobTitle(review.job)}`}
                  </p>
                </Link>

                <div className="flex flex-wrap gap-2 border-t border-border px-6 py-3">
                  {review.status !== "APPROVED" && !placeholder && (
                    <StatusButton id={review.id} status="APPROVED">Approve and put live</StatusButton>
                  )}
                  {placeholder && (
                    <Button asChild size="sm">
                      <Link href={`/admin/reviews/${review.id}`}>Paste in the real review</Link>
                    </Button>
                  )}
                  {review.status !== "HIDDEN" && (
                    <StatusButton id={review.id} status="HIDDEN" variant="ghost">
                      {review.status === "APPROVED" ? "Take off the website" : "Hide"}
                    </StatusButton>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function StatusButton({
  id,
  status,
  variant = "outline",
  children,
}: {
  id: string;
  status: ReviewStatus;
  variant?: "outline" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <form action={setReviewStatusAction}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <Button type="submit" size="sm" variant={variant}>
        {children}
      </Button>
    </form>
  );
}
