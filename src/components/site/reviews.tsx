import Link from "next/link";
import { Stars } from "@/components/site/stars";
import { Eyebrow } from "@/components/site/ornaments";
import { LeaveReviewDialog } from "@/components/site/leave-review-dialog";
import type { ReviewFormDefaults } from "@/components/site/review-form";
import type { PublicReview } from "@/lib/reviews";

export function ReviewCard({ review }: { review: Omit<PublicReview, "job"> & { job?: PublicReview["job"] } }) {
  return (
    <li className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white p-7 shadow-[0_1px_2px_rgb(6_42_29/0.04)] transition-[box-shadow,transform,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-champagne/60 hover:shadow-[var(--shadow-lift)] md:p-8">
      <span aria-hidden className="bg-gold absolute inset-x-0 top-0 h-0.5 origin-left scale-x-[0.18] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100" />
      <span aria-hidden className="pointer-events-none absolute -top-4 right-5 select-none font-display text-[7rem] leading-none text-champagne/25">
        &rdquo;
      </span>
      <Stars rating={review.rating} />
      <blockquote className="mt-5 whitespace-pre-line font-display text-[1.3125rem] font-medium leading-[1.4] text-ink">{review.body}</blockquote>
      <div className="mt-auto pt-6 text-sm text-sage">
        <p className="border-t border-border pt-4">
          <span className="font-medium text-ink">{review.authorName}</span>
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
    <section className="surface-ivory relative overflow-hidden py-24 md:py-36" aria-labelledby="reviews-heading">
      <span aria-hidden className="pointer-events-none absolute -top-10 right-[4%] select-none font-display text-[22rem] leading-none text-champagne/15 md:text-[34rem]">
        &rdquo;
      </span>
      <div className="shell relative">
        <div className="max-w-2xl" data-reveal>
          <Eyebrow>In their words</Eyebrow>
          <h2 id="reviews-heading" className="mt-5 font-display text-[2.25rem] leading-[1.06] md:text-[3.5rem]">
            {reviews.length ? "What people say once we’ve gone" : "Had a clean with us?"}
          </h2>
          <p className="mt-6 text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            {reviews.length
              ? "Every review here is from a real So Fresh customer, from our Google Business Profile or left on this site. We read each one before it goes up."
              : "Tell other customers how it went. We read every review before it goes on the website."}
          </p>
        </div>

        {reviews.length > 0 && (
          <ul className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-reveal>
            {reviews.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </ul>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4" data-reveal>
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
