import { Star } from "lucide-react";

export type Review = { authorName: string; area: string | null; body: string; rating: number };

export function Reviews({ reviews, googleUrl }: { reviews: Review[]; googleUrl: string | null }) {
  if (!reviews.length) return null;

  return (
    <section className="bg-mist py-20 md:py-28" aria-labelledby="reviews-heading">
      <div className="shell">
        <div className="max-w-2xl">
          <h2 id="reviews-heading" className="font-display text-3xl leading-tight md:text-[2.5rem]">
            What people say once we&rsquo;ve gone
          </h2>
          <p className="mt-4 text-[1.0625rem] leading-relaxed text-sage">
            Every review below is from a real So Fresh customer on our Google Business Profile.
          </p>
        </div>

        <ul className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <li key={`${review.authorName}-${review.body.slice(0, 24)}`} className="seam rounded-xl bg-white p-6 pl-7">
              <div className="flex gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} className="size-4 fill-champagne text-champagne" />
                ))}
              </div>
              <blockquote className="mt-4 text-[0.9375rem] leading-relaxed text-ink">{review.body}</blockquote>
              <p className="mt-5 text-sm text-sage">
                {review.authorName}
                {review.area ? `, ${review.area}` : ""}
              </p>
            </li>
          ))}
        </ul>

        {googleUrl && (
          <p className="mt-10">
            <a
              href={googleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[0.9375rem] font-medium text-verdant underline underline-offset-4"
            >
              Read every review on Google
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
