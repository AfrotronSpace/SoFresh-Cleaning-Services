import Link from "next/link";
import { ShieldCheck, Clock, MapPin, Sparkles } from "lucide-react";
import { Hero, FALLBACK_SLIDES, type HeroSlide } from "@/components/site/hero";
import { BeforeAfter } from "@/components/site/before-after";
import { ServiceCard, type ServiceCardData } from "@/components/site/service-card";
import { Reviews } from "@/components/site/reviews";
import { JsonLd } from "@/components/site/json-ld";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { getShowcasePair } from "@/lib/gallery-data";
import { ALL_FAQS, HOW_IT_WORKS } from "@/lib/content";
import { faqJsonLd } from "@/lib/seo";
import { whatsappLink } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getHomeData() {
  try {
    const [services, testimonials] = await Promise.all([
      prisma.service.findMany({
        where: { active: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        take: 7,
        select: {
          slug: true, name: true, summary: true, price: true, priceMode: true,
          negotiable: true, requiresSurvey: true, heroImage: true, featured: true,
        },
      }),
      prisma.testimonial.findMany({
        where: { active: true },
        orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
        take: 6,
      }),
    ]);
    return { services, testimonials };
  } catch {
    return { services: [], testimonials: [] };
  }
}

export default async function HomePage() {
  const [settings, { services, testimonials }, showcase] = await Promise.all([loadSettings(), getHomeData(), getShowcasePair("restoration-deep-clean")]);

  const slides = (settings.heroSlides as HeroSlide[] | null)?.length
    ? (settings.heroSlides as HeroSlide[])
    : FALLBACK_SLIDES;

  const cards: (ServiceCardData & { featured: boolean })[] = services.map((s) => ({
    ...s,
    price: s.price ? s.price.toString() : null,
  }));

  const featured = cards.find((s) => s.featured) ?? cards[0];
  const rest = cards.filter((s) => s.slug !== featured?.slug).slice(0, 5);

  return (
    <>
      <JsonLd data={faqJsonLd(ALL_FAQS.slice(0, 8))} />

      <Hero slides={slides} whatsapp={settings.whatsapp} />

      {/* Trust strip — four facts, no decoration. */}
      <section aria-label="Why choose So Fresh" className="border-b border-border bg-white">
        <ul className="shell grid gap-x-8 gap-y-6 py-8 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock, title: "Same-day replies", body: settings.responsePromise },
            { icon: Sparkles, title: "Fixed prices, not hourly guesses", body: "Quoted against an agreed scope, so the figure doesn't move on the day." },
            { icon: ShieldCheck, title: "Insured limited company", body: `Public liability cover. Company no. ${SITE.companyNumber}.` },
            { icon: MapPin, title: "Essex and Suffolk", body: settings.serviceAreas.slice(0, 4).join(", ") + " and nearby." },
          ].map((item) => (
            <li key={item.title} className="flex gap-3.5">
              <item.icon className="mt-0.5 size-5 shrink-0 text-champagne" strokeWidth={1.75} />
              <div>
                <h2 className="font-sans text-[0.9375rem] font-semibold text-ink">{item.title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-sage">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* The question tagline, then the catalogue. */}
      <section className="py-20 md:py-28" aria-labelledby="services-heading">
        <div className="shell">
          <div className="max-w-3xl">
            <h2 id="services-heading" className="font-display text-[2rem] leading-[1.12] md:text-[3rem]">
              What needs bringing back to life?
            </h2>
            <p className="mt-5 max-w-[58ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
              Pick whatever is closest. Every page tells you what&rsquo;s included, what isn&rsquo;t, and how we price it — and you can
              start a booking from there without ringing anyone.
            </p>
          </div>

          {cards.length > 0 ? (
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {featured && <ServiceCard service={featured} feature />}
              {rest.map((service) => (
                <ServiceCard key={service.slug} service={service} />
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-xl bg-mist p-6 text-[0.9375rem] text-sage">
              The service list is being set up. In the meantime, message us on WhatsApp and we&rsquo;ll talk it through.
            </p>
          )}

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button asChild variant="outline" size="lg">
              <Link href="/services">See the full service list</Link>
            </Button>
            <p className="text-[0.9375rem] text-sage">
              Or{" "}
              <Link href="/book" className="font-medium text-verdant underline underline-offset-4">
                describe the job yourself
              </Link>{" "}
              if none of these quite fit.
            </p>
          </div>
        </div>
      </section>

      {/* Signature showcase — the one place we spend real visual budget. */}
      <section className="bg-forest-deep py-20 text-white md:py-28" aria-labelledby="signature-heading">
        <div className="shell grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-sm text-champagne">Our signature service</p>
            <h2 id="signature-heading" className="mt-3 font-display text-[2rem] leading-[1.12] md:text-[2.75rem]">
              The restoration deep clean
            </h2>
            <div className="mt-6 max-w-[58ch] space-y-4 text-[1.0625rem] leading-relaxed text-white/70">
              <p>
                This is for clients who want a property cleaned properly, not made to look clean from a distance. We allocate
                the team and the hours to the condition of the building rather than to a price list.
              </p>
              <p>
                A big job might be three to five cleaners for seven to ten hours or more. We work methodically through the
                agreed areas, go back over the stubborn details, and run a final check before we hand it back to you.
              </p>
            </div>

            <dl className="mt-9 grid gap-x-8 gap-y-5 sm:grid-cols-2">
              {[
                ["Typically", "Half a day to a full day"],
                ["Priced", "Fixed, from £350"],
                ["Best for", "Empty, neglected or heavily soiled homes"],
                ["We need", "Photos, a video, or a free assessment"],
              ].map(([term, def]) => (
                <div key={term} className="seam pl-5">
                  <dt className="text-sm text-white/50">{term}</dt>
                  <dd className="mt-1 font-medium text-white">{def}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" variant="accent">
                <Link href="/services/restoration-deep-clean">What&rsquo;s included</Link>
              </Button>
              <Button asChild size="lg" className="border border-white/25 bg-transparent text-white hover:bg-white/10">
                <a
                  href={whatsappLink(settings.whatsapp, "Hi, I'd like a quote for a So Fresh Restoration Deep Clean.")}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask about it on WhatsApp
                </a>
              </Button>
            </div>
          </div>

          <div>
            {showcase ? (
              <>
                <BeforeAfter
                  before={showcase.frame.primary.url}
                  after={showcase.frame.secondary.url}
                  beforeAlt={showcase.frame.primary.alt}
                  afterAlt={showcase.frame.secondary.alt}
                />
                <p className="mt-3 text-sm text-white/50">
                  Drag the seam. {showcase.job.title}{showcase.job.area ? `, ${showcase.job.area}` : ""}.{" "}
                  <Link href={`/gallery?job=${showcase.job.id}`} className="text-champagne underline underline-offset-4">
                    See the whole job
                  </Link>
                </p>
              </>
            ) : (
              <>
                <BeforeAfter
                  before="/images/before-oven.jpg"
                  after="/images/after-oven.jpg"
                  beforeAlt="An oven interior heavily coated in baked-on grease before cleaning"
                  afterAlt="The same oven interior clean and clear after a restoration deep clean"
                />
                <p className="mt-3 text-sm text-white/50">Drag the seam. Real job, Colchester.</p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How it works — genuinely a sequence, so numbering earns its place. */}
      <section className="py-20 md:py-28" aria-labelledby="process-heading">
        <div className="shell">
          <h2 id="process-heading" className="max-w-xl font-display text-[2rem] leading-[1.12] md:text-[2.75rem]">
            From first message to booked job
          </h2>
          <ol className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((step, index) => (
              <li key={step.title} className="seam pl-6">
                <span className="font-display text-3xl font-medium text-champagne">{index + 1}</span>
                <h3 className="mt-3 font-sans text-[1.0625rem] font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 text-[0.9375rem] leading-relaxed text-sage">{step.body}</p>
              </li>
            ))}
          </ol>

          <p className="mt-12 max-w-[62ch] rounded-xl bg-mist p-6 text-[0.9375rem] leading-relaxed text-sage">
            <strong className="font-semibold text-ink">No payment is taken through this website.</strong> There is no card
            checkout here. Once you&rsquo;ve accepted a price, payment is arranged directly with us by bank transfer or a secure
            payment link, exactly as it would be over the phone.
          </p>
        </div>
      </section>

      <Reviews
        reviews={testimonials.map((t) => ({ authorName: t.authorName, area: t.area, body: t.body, rating: t.rating }))}
        googleUrl={settings.googleReviewUrl}
      />

      {/* Areas */}
      <section className="py-20 md:py-28" aria-labelledby="areas-heading">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-20">
          <div>
            <h2 id="areas-heading" className="font-display text-[2rem] leading-[1.12] md:text-[2.75rem]">
              Where we work
            </h2>
            <p className="mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-sage">
              We&rsquo;re based in Colchester and cover Essex and Suffolk. If you&rsquo;re further out, ask anyway — travel or a minimum
              booking may apply depending on the distance and the size of the job.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link href="/areas">Check your area</Link>
            </Button>
          </div>

          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 self-center sm:grid-cols-3">
            {settings.serviceAreas.map((area) => (
              <li key={area}>
                <Link
                  href={`/areas/${area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="block border-b border-border py-3.5 font-display text-lg text-ink transition-colors hover:text-verdant"
                >
                  {area}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-mist py-20 md:py-28" aria-labelledby="faq-heading">
        <div className="shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div>
            <h2 id="faq-heading" className="font-display text-[2rem] leading-[1.12] md:text-[2.75rem]">
              Questions we get asked
            </h2>
            <p className="mt-5 text-[1.0625rem] leading-relaxed text-sage">
              The full set lives in the{" "}
              <Link href="/help" className="font-medium text-verdant underline underline-offset-4">
                help centre
              </Link>
              .
            </p>
          </div>

          <Accordion type="single" collapsible className="border-t border-border">
            {ALL_FAQS.slice(0, 6).map((faq) => (
              <AccordionItem key={faq.q} value={faq.q}>
                <AccordionTrigger>{faq.q}</AccordionTrigger>
                <AccordionContent>{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Closing CTA — the only centred block on the page. */}
      <section className="py-20 md:py-28">
        <div className="shell text-center">
          <h2 className="mx-auto max-w-2xl font-display text-[2rem] leading-[1.12] md:text-[3rem]">
            Send us a few photos and we&rsquo;ll tell you what it costs
          </h2>
          <p className="mx-auto mt-5 max-w-[52ch] text-[1.0625rem] leading-relaxed text-sage">
            {settings.quoteWindow}
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" variant="whatsapp">
              <a
                href={whatsappLink(settings.whatsapp, "Hi, I'd like a quote for a clean. Here are some photos:")}
                target="_blank"
                rel="noopener noreferrer"
              >
                Message {SITE.whatsappDisplay}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/book">Fill in the booking form</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
