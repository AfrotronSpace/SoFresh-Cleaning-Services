import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { AdminReviewForm } from "@/components/admin/review-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";
import { getJobOptions } from "@/lib/review-data";
import { REVIEW_SOURCE, REVIEW_STATUS } from "@/lib/reviews";
import { deleteReviewAction } from "@/app/actions/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit review", robots: { index: false, follow: false } };

export default async function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdmin(`/admin/reviews/${id}`);

  const [review, jobs, settings] = await Promise.all([
    prisma.testimonial.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true } } },
    }),
    getJobOptions(),
    loadSettings(),
  ]);
  if (!review) notFound();

  const [bookings, jobPublished] = await Promise.all([
    // Helps the admin confirm a website review came from someone who actually booked.
    review.email
      ? prisma.booking.findMany({
          where: { contactEmail: review.email },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, reference: true, status: true, preferredDate: true },
        })
      : Promise.resolve([]),
    review.jobId ? prisma.galleryJob.count({ where: { id: review.jobId, published: true } }) : Promise.resolve(0),
  ]);

  return (
    <>
      <PageHeader
        title={`Review from ${review.authorName}`}
        description={`${REVIEW_STATUS[review.status].label} · ${REVIEW_SOURCE[review.source]} · added ${formatDateTime(review.createdAt)}`}
        action={
          <div className="flex gap-2">
            {review.status === "APPROVED" && (
              <Button asChild variant="ghost">
                <Link href="/reviews" target="_blank">View on site</Link>
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link href="/admin/reviews">Back</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        {review.source === "WEBSITE" && (
          <section className="rounded-2xl border border-border bg-white p-6">
            <h2 className="font-display text-lg">Who sent it</h2>
            <p className="mt-2 text-[0.9375rem] leading-relaxed text-sage">
              {review.email ? (
                <a href={`mailto:${review.email}`} className="font-medium text-verdant underline underline-offset-4">
                  {review.email}
                </a>
              ) : (
                "No email given"
              )}
              {review.user && (
                <>
                  {" · signed in as "}
                  <Link href={`/admin/customers/${review.user.id}`} className="font-medium text-verdant underline underline-offset-4">
                    {review.user.name}
                  </Link>
                </>
              )}
              . Private — never shown on the website.
            </p>
            {bookings.length > 0 ? (
              <ul className="mt-3 space-y-1 text-sm">
                {bookings.map((b) => (
                  <li key={b.id}>
                    <Link href={`/admin/bookings/${b.id}`} className="font-medium text-verdant underline underline-offset-4">
                      {b.reference}
                    </Link>{" "}
                    <span className="text-sage">· {b.status.toLowerCase().replace(/_/g, " ")}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-lg bg-champagne-soft/40 px-4 py-3 text-sm text-[#5c4715]">
                No booking on this website under that email. They may have booked by WhatsApp or phone — worth checking before you approve.
              </p>
            )}
            {review.jobId && !jobPublished && (
              <p className="mt-3 text-sm text-sage">The linked gallery job is a draft, so the review won&rsquo;t show inside it until the job is published.</p>
            )}
          </section>
        )}

        <AdminReviewForm
          jobs={jobs}
          areas={settings.serviceAreas}
          googleUrl={settings.googleReviewUrl}
          initial={{
            id: review.id,
            authorName: review.authorName,
            area: review.area ?? "",
            rating: review.rating,
            body: review.body,
            source: review.source,
            status: review.status,
            jobId: review.jobId ?? "",
            featured: review.featured,
            sortOrder: review.sortOrder,
          }}
        />

        <form action={deleteReviewAction} className="rounded-2xl border border-border bg-white p-6">
          <input type="hidden" name="id" value={review.id} />
          <h2 className="font-display text-lg">Delete this review</h2>
          <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-sage">
            Removes it for good. To keep it but take it off the website, set it to Hidden instead.
          </p>
          <ConfirmSubmit className="mt-5" message="Delete this review permanently? This can't be undone.">
            Delete review
          </ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
