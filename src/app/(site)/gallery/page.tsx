import Link from "next/link";
import type { Metadata } from "next";
import { GalleryGrid } from "@/components/site/gallery-grid";
import { StickyContactBar } from "@/components/site/sticky-contact-bar";
import { JsonLd } from "@/components/site/json-ld";
import { Button } from "@/components/ui/button";
import { loadSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { getGalleryServiceFilters, getPublishedJob, getPublishedJobs } from "@/lib/gallery-data";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { cn, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Our work — completed jobs",
  description:
    "Before and after photos and videos from real So Fresh jobs across Essex and Suffolk: restoration deep cleans, end of tenancy, after-builders and commercial cleaning.",
  path: "/gallery",
});

type Search = { searchParams: Promise<{ service?: string; page?: string; job?: string }> };

function href(params: { service?: string; page?: number }) {
  const q = new URLSearchParams();
  if (params.service) q.set("service", params.service);
  if (params.page && params.page > 1) q.set("page", String(params.page));
  const s = q.toString();
  return s ? `/gallery?${s}` : "/gallery";
}

export default async function GalleryPage({ searchParams }: Search) {
  const { service, page: rawPage, job: jobId } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);

  const [settings, filters, result, linkedJob, session] = await Promise.all([
    loadSettings(),
    getGalleryServiceFilters(),
    getPublishedJobs({ serviceSlug: service, page }),
    jobId ? getPublishedJob(jobId) : Promise.resolve(null),
    getSession(),
  ]);

  const activeService = filters.find((f) => f.slug === service);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Our work", path: "/gallery" },
        ])}
      />

      <header className="border-b border-border bg-mist">
        <div className="shell py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">Our work</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.1] md:text-[3.25rem]">
            Real jobs, photographed on the day
          </h1>
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            Before-and-afters, the team mid-job, and the finished result. Every property here is shown with the
            customer&rsquo;s permission, and we name the town, never the address.
          </p>
        </div>
      </header>

      <div className="shell py-12 md:py-16">
        {filters.length > 1 && (
          <nav aria-label="Filter by service" className="-mx-1 mb-10 overflow-x-auto px-1 pb-1">
            <ul className="flex gap-2">
              {[{ slug: undefined, name: "All work" }, ...filters].map((f) => {
                const active = f.slug === activeService?.slug;
                return (
                  <li key={f.slug ?? "all"}>
                    <Link
                      href={href({ service: f.slug })}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "inline-flex whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                        active ? "border-forest bg-forest text-white" : "border-border bg-white text-sage hover:border-forest/40 hover:text-forest",
                      )}
                    >
                      {f.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        )}

        {result.jobs.length > 0 ? (
          <GalleryGrid
            jobs={result.jobs}
            linkedJob={linkedJob}
            whatsapp={settings.whatsapp}
            reviewDefaults={session ? { name: session.name, email: session.email } : null}
            areas={settings.serviceAreas}
          />
        ) : (
          <div className="rounded-2xl bg-mist p-8 md:p-10">
            <h2 className="font-display text-2xl leading-tight">
              {activeService ? `No ${activeService.name.toLowerCase()} jobs up yet` : "Photos from recent jobs are on their way"}
            </h2>
            <p className="mt-3 max-w-[58ch] text-[0.9375rem] leading-relaxed text-sage">
              Ask us on WhatsApp and we&rsquo;ll happily send examples of work like yours.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button asChild variant="whatsapp">
                <a href={whatsappLink(settings.whatsapp, "Hi, could you send me some examples of your work?")} target="_blank" rel="noopener noreferrer">
                  Ask on WhatsApp
                </a>
              </Button>
              {activeService && (
                <Button asChild variant="outline">
                  <Link href="/gallery">See all work</Link>
                </Button>
              )}
            </div>
          </div>
        )}

        {result.pageCount > 1 && (
          <nav aria-label="Gallery pages" className="mt-14 flex items-center justify-between gap-4 border-t border-border pt-6">
            {result.page > 1 ? (
              <Button asChild variant="outline">
                <Link href={href({ service, page: result.page - 1 })}>Newer jobs</Link>
              </Button>
            ) : (
              <span />
            )}
            <p className="text-sm text-sage">
              Page {result.page} of {result.pageCount}
            </p>
            {result.page < result.pageCount ? (
              <Button asChild variant="outline">
                <Link href={href({ service, page: result.page + 1 })}>Older jobs</Link>
              </Button>
            ) : (
              <span />
            )}
          </nav>
        )}

        <div className="mt-16 rounded-2xl border border-dashed border-champagne/70 bg-champagne-soft/20 p-8 md:p-10">
          <h2 className="font-display text-2xl leading-tight">Got a property that looks like a &ldquo;before&rdquo;?</h2>
          <p className="mt-3 max-w-[58ch] text-[0.9375rem] leading-relaxed text-sage">
            Send us a few photos or a short video and we&rsquo;ll price it on its condition — not a bedroom count.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link href="/book">Start a booking</Link>
          </Button>
        </div>
      </div>

      <StickyContactBar whatsapp={settings.whatsapp} message="Hi, I'd like a quote for a clean." bookHref="/book" />
    </>
  );
}
