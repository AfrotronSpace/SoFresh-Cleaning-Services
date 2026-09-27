import Link from "next/link";
import { Stars } from "@/components/site/stars";
import { LeaveReviewDialog } from "@/components/site/leave-review-dialog";
import type { ReviewFormDefaults } from "@/components/site/review-form";
import type { PublicReview } from "@/lib/reviews";

export function ReviewCard({ review }: { review: Omit<PublicReview, "job"> & { job?: PublicReview["job"] } }) {
  return (
    <li className="seam flex flex-col rounded-xl bg-white p-6 pl-7">
      <Stars rating={review.rating} />
      <blockquote className="mt-4 whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink">{review.body}</blockquote>
      <div className="mt-auto pt-5 text-sm text-sage">
        <p>
          {review.authorName}
          {review.area ? `, ${review.area}` : ""}
          <span className="text-sage/70"> · {review.source === "GOOGLE" ? "on Google" : "on our website"}</span>
        </p>
        {review.job && (
          <Link href={`/gallery?job=${review.job.id}`} className="mt-1.5 inline-block font-medium text-verdant underline underline-offset-4">
            See the job: {review.job.title}
          </Link>
        )}
      </div>
    </li>
  );
}

export function Reviews({
  reviews,
  total,
  googleUrl,
  defaults,
  areas,
}: {
  reviews: PublicReview[];
  total: number;
  googleUrl: string | null;
  defaults?: ReviewFormDefaults | null;
  areas?: string[];
}) {
  return (
    <section className="bg-mist py-20 md:py-28" aria-labelledby="reviews-heading">
      <div className="shell">
        <div className="max-w-2xl">
          <h2 id="reviews-heading" className="font-display text-3xl leading-tight md:text-[2.5rem]">
            {reviews.length ? "What people say once we’ve gone" : "Had a clean with us?"}
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-sage">
            {reviews.length
              ? "Every review here is from a real So Fresh customer, from our Google Business Profile or left on this site. We read each one before it goes up."
              : "Tell other customers how it went. We read every review before it goes on the website."}
          </p>
        </div>

        {reviews.length > 0 && (
          <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-4">
          <LeaveReviewDialog defaults={defaults} areas={areas} variant="outline" />
          {total > reviews.length && (
            <Link href="/reviews" className="text-[0.9375rem] font-medium text-verdant underline underline-offset-4">
              Read all {total} reviews
            </Link>
          )}
          {googleUrl && (
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.9375rem] font-medium text-verdant underline underline-offset-4"
            >
              Read our reviews on Google
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
