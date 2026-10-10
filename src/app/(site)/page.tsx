import Link from "next/link";
import { ArrowRight, ArrowUpRight, Clock, MapPin, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import { Hero, FALLBACK_SLIDES, type HeroSlide } from "@/components/site/hero";
import { BeforeAfter } from "@/components/site/before-after";
import { ServiceCard, type ServiceCardData } from "@/components/site/service-card";
import { Reviews } from "@/components/site/reviews";
import { JsonLd } from "@/components/site/json-ld";
import { Eyebrow, Sparkle } from "@/components/site/ornaments";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { getShowcasePair } from "@/lib/gallery-data";
import { getApprovedReviews } from "@/lib/review-data";
import { getSession } from "@/lib/auth";
import { HOW_IT_WORKS } from "@/lib/content";
import { loadFaqs } from "@/lib/faq-data";
import { faqJsonLd } from "@/lib/seo";
import { formatUkNumber, whatsappLink } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

async function getServices() {
  return prisma.service
    .findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      take: 7,
      select: {
        slug: true, name: true, summary: true, price: true, priceMode: true,
        negotiable: true, requiresSurvey: true, heroImage: true, featured: true,
      },
    })
    .catch(() => []);
}

/** Stagger for anything revealed in a row: each item waits a beat longer. */
const delay = (i: number, step = 110) => ({ "--reveal-delay": `${i * step}ms` }) as React.CSSProperties;

export default async function HomePage() {
  const [settings, services, reviews, showcase, session, faqs] = await Promise.all([
    loadSettings(),
    getServices(),
    getApprovedReviews({ take: 6 }),
    getShowcasePair("restoration-deep-clean"),
    getSession(),
    loadFaqs(),
  ]);

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
      <JsonLd data={faqJsonLd(faqs.all.slice(0, 8))} />

      <Hero slides={slides} whatsapp={settings.whatsapp} />

      {/* Trust strip — four facts on a card that floats over the foot of the hero. */}
      <section aria-label="Why choose So Fresh" className="relative z-10 -mt-16 md:-mt-20">
        <div className="shell">
          <ul className="grid overflow-hidden rounded-2xl border border-champagne/30 bg-white shadow-[var(--shadow-float)] sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Clock, title: "Same-day replies", body: settings.responsePromise },
              { icon: Sparkles, title: "Fixed prices, not hourly guesses", body: "Quoted against an agreed scope, so the figure doesn't move on the day." },
              { icon: ShieldCheck, title: "Insured limited company", body: `Public liability cover. Company no. ${SITE.companyNumber}.` },
              { icon: MapPin, title: "Essex and Suffolk", body: settings.serviceAreas.slice(0, 4).join(", ") + " and nearby." },
            ].map((item) => (
              <li
                key={item.title}
                className="group relative border-b border-border p-7 last:border-b-0 sm:[&:nth-child(odd)]:border-r sm:[&:nth-last-child(-n+2)]:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0 lg:p-8"
              >
                <span className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-ivory to-champagne-soft/70 text-gold-deep ring-1 ring-champagne/40 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1">
                  <item.icon className="size-5" strokeWidth={1.5} />
                </span>
                <h2 className="mt-5 font-display text-[1.375rem] leading-tight text-ink">{item.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-sage">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Where we work, as a slow band. Decorative: the real links are in the Areas section. */}
      <div aria-hidden className="marquee-mask mt-16 overflow-hidden md:mt-24">
        <div className="marquee-track flex w-max animate-marquee items-center">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex shrink-0 items-center">
              {[...settings.serviceAreas, ...settings.serviceAreas].map((area, i) => (
                <span key={`${copy}-${i}`} className="flex items-center">
                  <span className="px-7 font-display text-[1.75rem] italic text-forest/45 md:px-10 md:text-[2.5rem]">{area}</span>
                  <Sparkle className="size-3 text-champagne" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* The question tagline, then the catalogue. */}
      <section className="py-20 md:py-32" aria-labelledby="services-heading">
        <div className="shell">
          <div className="grid items-end gap-8 lg:grid-cols-[1.25fr_1fr] lg:gap-20">
            <div data-reveal>
              <Eyebrow>The services</Eyebrow>
              <h2 id="services-heading" className="mt-5 font-display text-[2.5rem] leading-[1.02] md:text-[4.25rem]">
                What needs bringing <em className="text-gold">back to life?</em>
              </h2>
            </div>
            <p className="max-w-[52ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg lg:pb-3" data-reveal style={delay(1)}>
              Pick whatever is closest. Every page tells you what&rsquo;s included, what isn&rsquo;t, and how we price it — and you can
              start a booking from there without ringing anyone.
            </p>
          </div>

          <div aria-hidden className="hairline-gold mt-12 md:mt-16" data-reveal="line" />

          {cards.length > 0 ? (
            <div className="mt-12 grid gap-6 md:mt-16 md:grid-cols-2 lg:grid-cols-3">
              {featured && (
                <div className="md:col-span-2 lg:col-span-3" data-reveal>
                  <ServiceCard service={featured} feature />
                </div>
              )}
              {rest.map((service, i) => (
                <div key={service.slug} data-reveal style={delay(i % 3)}>
                  <ServiceCard service={service} />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-10 rounded-xl bg-mist p-6 text-[0.9375rem] text-sage">
              The service list is being set up. In the meantime, message us on WhatsApp and we&rsquo;ll talk it through.
            </p>
          )}

          <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-4" data-reveal>
            <Button asChild variant="outline" size="lg" className="group">
              <Link href="/services">
                See the full service list
                <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
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
      <section className="surface-emerald relative overflow-hidden py-24 text-white md:py-36" aria-labelledby="signature-heading">
        <div aria-hidden className="grain-light absolute inset-0 opacity-70" />
        <div aria-hidden className="hairline-gold absolute inset-x-0 top-0" />
        <div aria-hidden className="hairline-gold absolute inset-x-0 bottom-0" />
        <Sparkle className="absolute right-[6%] top-16 hidden size-6 animate-twinkle text-champagne/70 lg:block" />

        <div className="shell relative grid items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <div>
            <div data-reveal>
              <Eyebrow light>Our signature service</Eyebrow>
              <h2 id="signature-heading" className="mt-5 font-display text-[2.5rem] leading-[1.02] md:text-[4rem]">
                The restoration <em className="text-gold">deep clean</em>
              </h2>
            </div>
            <div className="mt-7 max-w-[58ch] space-y-4 text-[1.0625rem] leading-relaxed text-white/70" data-reveal style={delay(1)}>
              <p>
                For clients who want a genuinely thorough finish, with every room properly worked through and nothing rushed.
                Beyond the skirting boards, switches, doors and frames, the team works into the finer
                detail: built-up residue, overlooked edges, corners, fittings and grease, the areas a rushed clean always misses.
              </p>
              <p>
                Where suitable, we use steam in kitchens and bathrooms to lift stubborn grime and sanitise the surfaces. The team
                and the hours are allocated to the condition of the property, not a price list. A big job might be three to five
                cleaners for seven to ten hours or more, finished with a final check before we hand it back to you.
              </p>
            </div>

            <dl className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
              {[
                ["Typically", "Half a day to a full day"],
                ["Priced", "Fixed quote, set by condition"],
                ["Best for", "Empty, neglected or heavily soiled homes"],
                ["We need", "Photos, a video, or a free assessment"],
              ].map(([term, def], i) => (
                <div key={term} className="seam pl-5" data-reveal style={delay(i % 2)}>
                  <dt className="text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-champagne/80">{term}</dt>
                  <dd className="mt-2 font-display text-[1.375rem] leading-snug text-white">{def}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-11 flex flex-col gap-3 sm:flex-row" data-reveal>
              <Button asChild size="lg" variant="accent" className="group">
                <Link href="/services/restoration-deep-clean">
                  What&rsquo;s included
                  <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                className="border border-white/25 bg-white/5 bg-none text-white shadow-none hover:border-champagne/70 hover:bg-white/10 hover:shadow-none"
              >
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

          <div data-reveal="scale" style={delay(1)}>
            <div className="relative">
              <div aria-hidden className="absolute -inset-3 rounded-[2rem] border border-champagne/25 md:-inset-4" />
              <div aria-hidden className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgb(198_168_107/0.18),transparent)]" />
              {showcase ? (
                <BeforeAfter
                  before={showcase.frame.primary.url}
                  after={showcase.frame.secondary.url}
                  beforeAlt={showcase.frame.primary.alt}
                  afterAlt={showcase.frame.secondary.alt}
                  className="md:aspect-[5/4]"
                />
              ) : (
                <BeforeAfter
                  before="/images/before-oven.jpg"
                  after="/images/after-oven.jpg"
                  beforeAlt="The outside wall of a white-clad house streaked with dirt, with cobwebs across the window and litter along the flower bed"
                  afterAlt="The same wall and window clean, with the cobwebs and litter cleared"
                  className="md:aspect-[5/4]"
                />
              )}
            </div>
            {showcase ? (
              <p className="mt-8 text-sm text-white/55">
                Drag the seam. {showcase.job.title}{showcase.job.area ? `, ${showcase.job.area}` : ""}.{" "}
                <Link href={`/gallery?job=${showcase.job.id}`} className="text-champagne underline underline-offset-4">
                  See the whole job
                </Link>
              </p>
            ) : (
              <p className="mt-8 text-sm text-white/55">Drag the seam to compare.</p>
            )}
          </div>
        </div>
      </section>

      {/* How it works — genuinely a sequence, so numbering earns its place. */}
      <section className="py-24 md:py-36" aria-labelledby="process-heading">
        <div className="shell">
          <div className="max-w-2xl" data-reveal>
            <Eyebrow>How it works</Eyebrow>
            <h2 id="process-heading" className="mt-5 font-display text-[2.5rem] leading-[1.02] md:text-[4rem]">
              From first message <em className="text-gold">to booked job</em>
            </h2>
          </div>

          <div className="relative mt-14 md:mt-20">
            <div aria-hidden className="hairline-gold absolute inset-x-0 top-7 hidden lg:block" data-reveal="line" />
            <ol className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-4">
              {HOW_IT_WORKS.map((step, index) => (
                <li key={step.title} className="group relative" data-reveal style={delay(index, 140)}>
                  <span className="relative grid size-14 place-items-center rounded-full border border-champagne/60 bg-white font-display text-2xl italic text-gold-deep shadow-[0_10px_26px_-14px_rgb(138_108_47/0.7)] transition-[background-color,color,transform] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:bg-forest group-hover:text-gold-light">
                    0{index + 1}
                  </span>
                  <h3 className="mt-7 font-display text-[1.625rem] leading-tight text-ink">{step.title}</h3>
                  <p className="mt-3 text-[0.9375rem] leading-relaxed text-sage">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>

          <p
            className="surface-ivory mt-16 max-w-[68ch] rounded-2xl border border-champagne/35 p-7 text-[0.9375rem] leading-relaxed text-sage md:p-8"
            data-reveal
          >
            <strong className="font-semibold text-ink">No payment is taken through this website.</strong> There is no card
            checkout here. Once you&rsquo;ve accepted a price, payment is arranged directly with us by bank transfer or a secure
            payment link, exactly as it would be over the phone.
          </p>
        </div>
      </section>

      <Reviews
        reviews={reviews.reviews}
        total={reviews.total}
        googleUrl={settings.googleReviewUrl}
        defaults={session ? { name: session.name, email: session.email } : null}
        areas={settings.serviceAreas}
      />

      {/* Areas */}
      <section className="py-24 md:py-36" aria-labelledby="areas-heading">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:gap-24">
          <div data-reveal>
            <Eyebrow>Where we work</Eyebrow>
            <h2 id="areas-heading" className="mt-5 font-display text-[2.5rem] leading-[1.02] md:text-[4rem]">
              Essex and Suffolk, <em className="text-gold">town by town</em>
            </h2>
            <p className="mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
              We&rsquo;re based in Colchester and cover Essex and Suffolk. If you&rsquo;re further out, ask anyway — travel or a minimum
              booking may apply depending on the distance and the size of the job.
            </p>
            <Button asChild variant="outline" size="lg" className="group mt-8">
              <Link href="/areas">
                Check your area
                <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <ul className="self-center border-t border-border">
            {settings.serviceAreas.map((area, i) => (
              <li key={area} data-reveal style={delay(i, 70)}>
                <Link
                  href={`/areas/${area.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                  className="group flex items-center justify-between gap-6 border-b border-border py-5 transition-[padding,border-color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-champagne hover:pl-4"
                >
                  <span className="flex items-baseline gap-5">
                    <span className="font-display text-base italic text-gold-deep">0{i + 1}</span>
                    <span className="font-display text-[1.75rem] leading-none text-ink transition-colors duration-500 group-hover:text-emerald md:text-[2.25rem]">
                      {area}
                    </span>
                  </span>
                  <ArrowUpRight className="size-5 shrink-0 text-champagne transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-1 group-hover:translate-x-1" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="surface-ivory py-24 md:py-36" aria-labelledby="faq-heading">
        <div className="shell grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
          <div data-reveal>
            <Eyebrow>Good to know</Eyebrow>
            <h2 id="faq-heading" className="mt-5 font-display text-[2.5rem] leading-[1.02] md:text-[4rem]">
              Questions we <em className="text-gold">get asked</em>
            </h2>
            <p className="mt-6 text-[1.0625rem] leading-relaxed text-sage md:text-lg">
              The full set lives in the{" "}
              <Link href="/help" className="font-medium text-verdant underline underline-offset-4">
                help centre
              </Link>
              .
            </p>
          </div>

          <div data-reveal style={delay(1)}>
            <Accordion type="single" collapsible className="border-t border-champagne/40">
              {faqs.all.slice(0, 6).map((faq) => (
                <AccordionItem key={faq.q} value={faq.q}>
                  <AccordionTrigger>{faq.q}</AccordionTrigger>
                  <AccordionContent>{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Closing CTA — the only centred block on the page, set as an invitation. */}
      <section className="pt-24 md:pt-36">
        <div className="shell">
          <div
            className="surface-emerald frame-gold relative overflow-hidden rounded-[2rem] px-6 py-20 text-center text-white shadow-[var(--shadow-panel)] md:rounded-[2.5rem] md:px-16 md:py-28"
            data-reveal="scale"
          >
            <div aria-hidden className="grain-light absolute inset-0 opacity-70" />
            <div
              aria-hidden
              className="absolute left-1/2 top-0 size-[40rem] -translate-x-1/2 -translate-y-1/2 animate-drift rounded-full bg-[radial-gradient(closest-side,rgb(198_168_107/0.22),transparent)]"
            />
            <div className="relative">
              <Sparkle className="mx-auto size-6 animate-twinkle text-champagne" />
              <h2 className="mx-auto mt-7 max-w-3xl font-display text-[2.5rem] leading-[1.02] md:text-[4.25rem]">
                Send us a few photos and we&rsquo;ll <em className="text-gold">tell you what it costs</em>
              </h2>
              <p className="mx-auto mt-6 max-w-[52ch] text-[1.0625rem] leading-relaxed text-white/70 md:text-lg">
                {settings.quoteWindow}
              </p>
              <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild size="lg" variant="whatsapp">
                  <a
                    href={whatsappLink(settings.whatsapp, "Hi, I'd like a quote for a clean. Here are some photos:")}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle />
                    Message {formatUkNumber(settings.whatsapp)}
                  </a>
                </Button>
                <Button asChild size="lg" variant="accent" className="group">
                  <Link href="/book">
                    Fill in the booking form
                    <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
