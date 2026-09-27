import Link from "next/link";
import type { Metadata } from "next";
import { ReviewCard } from "@/components/site/reviews";
import { ReviewForm } from "@/components/site/review-form";
import { Stars } from "@/components/site/stars";
import { JsonLd } from "@/components/site/json-ld";
import { Button } from "@/components/ui/button";
import { loadSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { getApprovedReviews, getReviewableJob } from "@/lib/review-data";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Customer reviews",
  description:
    "What So Fresh customers across Essex and Suffolk say about their deep cleans, end of tenancy cleans and after-builders cleans — and a place to leave your own review.",
  path: "/reviews",
});

type Search = { searchParams: Promise<{ page?: string; job?: string }> };

const pageHref = (page: number) => (page > 1 ? `/reviews?page=${page}` : "/reviews");

export default async function ReviewsPage({ searchParams }: Search) {
  const { page: rawPage, job: jobId } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  const [settings, result, job, session] = await Promise.all([
    loadSettings(),
    getApprovedReviews({ page }),
    jobId ? getReviewableJob(jobId) : Promise.resolve(null),
    getSession(),
  ]);

  const average = result.average ? Math.round(result.average * 10) / 10 : null;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Reviews", path: "/reviews" },
        ])}
      />

      <header className="border-b border-border bg-mist">
        <div className="shell py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">Reviews</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.1] md:text-[3.25rem]">What our customers say</h1>
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            Reviews from our Google Business Profile and from customers who left one here. We read every review before it
            goes up, and we show first names and towns only.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
            {average !== null && result.total > 0 && (
              <div className="flex items-center gap-3">
                <Stars rating={Math.round(average)} />
                <p className="text-[0.9375rem] text-ink">
                  <strong className="font-semibold">{average.toFixed(1)}</strong> out of 5 from {result.total} review
                  {result.total === 1 ? "" : "s"}
                </p>
              </div>
            )}
            <Button asChild variant="outline">
              <a href="#leave-a-review">Leave a review</a>
            </Button>
            {settings.googleReviewUrl && (
              <a
                href={settings.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[0.9375rem] font-medium text-verdant underline underline-offset-4"
              >
                Read our reviews on Google
              </a>
            )}
          </div>
        </div>
      </header>

      <div className="shell grid gap-14 py-12 md:py-16 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <section aria-label="Reviews">
          {result.reviews.length > 0 ? (
            <ul className="grid gap-5 md:grid-cols-2">
              {result.reviews.map((review) => (
                <ReviewCard key={review.id} review={review} />
              ))}
            </ul>
          ) : (
            <div className="rounded-2xl bg-mist p-8 md:p-10">
              <h2 className="font-display text-2xl leading-tight">No reviews here yet</h2>
              <p className="mt-3 max-w-[58ch] text-[0.9375rem] leading-relaxed text-sage">
                Had a clean with us? Yours could be the first.
              </p>
            </div>
          )}

          {result.pageCount > 1 && (
            <nav aria-label="Review pages" className="mt-12 flex items-center justify-between gap-4 border-t border-border pt-6">
              {result.page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={pageHref(result.page - 1)}>Previous</Link>
                </Button>
              ) : (
                <span />
              )}
              <p className="text-sm text-sage">
                Page {result.page} of {result.pageCount}
              </p>
              {result.page < result.pageCount ? (
                <Button asChild variant="outline">
                  <Link href={pageHref(result.page + 1)}>More reviews</Link>
                </Button>
              ) : (
                <span />
              )}
            </nav>
          )}
        </section>

        <aside id="leave-a-review" aria-labelledby="leave-a-review-heading" className="scroll-mt-28">
          <div className="rounded-2xl border border-border bg-white p-6 md:p-8">
            <h2 id="leave-a-review-heading" className="font-display text-2xl leading-tight">
              Leave a review
            </h2>
            <p className="mb-6 mt-2 text-[0.9375rem] leading-relaxed text-sage">
              Had a clean with So Fresh? Tell other customers how it went.
            </p>
            <ReviewForm
              job={job}
              defaults={session ? { name: session.name, email: session.email } : null}
              areas={settings.serviceAreas}
            />
          </div>
        </aside>
      </div>
    </>
  );
}
