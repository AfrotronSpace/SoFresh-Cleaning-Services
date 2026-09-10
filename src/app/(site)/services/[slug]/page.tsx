import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Check, Clock, Minus, CalendarClock, Camera } from "lucide-react";
import { BookingWizard, type WizardService } from "@/components/booking/booking-wizard";
import { StickyContactBar } from "@/components/site/sticky-contact-bar";
import { JsonLd } from "@/components/site/json-ld";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { getSession } from "@/lib/auth";
import { buildMetadata, serviceJsonLd, breadcrumbJsonLd, faqJsonLd } from "@/lib/seo";
import { formatMoney, whatsappLink } from "@/lib/utils";
import type { Faq } from "@/lib/content";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function getService(slug: string) {
  return prisma.service
    .findFirst({ where: { slug, active: true }, include: { images: { orderBy: { sortOrder: "asc" } } } })
    .catch(() => null);
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) return buildMetadata({ title: "Service not found", path: `/services/${slug}`, noIndex: true });

  return buildMetadata({
    title: service.seoTitle ?? service.name,
    description: service.seoDescription ?? service.summary,
    path: `/services/${service.slug}`,
    image: service.heroImage ?? undefined,
  });
}

export default async function ServiceDetailPage({ params }: Params) {
  const { slug } = await params;
  const service = await getService(slug);
  if (!service) notFound();

  const [settings, session, others] = await Promise.all([
    loadSettings(),
    getSession(),
    prisma.service
      .findMany({
        where: { active: true, slug: { not: slug } },
        orderBy: { sortOrder: "asc" },
        select: { id: true, slug: true, name: true, summary: true, price: true, priceMode: true, negotiable: true, requiresSurvey: true, extras: true },
      })
      .catch(() => []),
  ]);

  const user = session
    ? await prisma.user.findUnique({ where: { id: session.id } }).catch(() => null)
    : null;

  const toWizard = (s: typeof service | (typeof others)[number]): WizardService => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    summary: s.summary,
    price: s.price ? s.price.toString() : null,
    priceMode: s.priceMode,
    negotiable: s.negotiable,
    requiresSurvey: s.requiresSurvey,
    extras: Array.isArray(s.extras) ? (s.extras as { name: string }[]) : [],
  });

  const wizardServices = [toWizard(service), ...others.map(toWizard)];
  const faqs = (Array.isArray(service.faqs) ? (service.faqs as Faq[]) : []).filter((f) => f?.q && f?.a);
  const paragraphs = service.body.split(/\n{2,}/).filter(Boolean);

  const headlinePrice =
    service.priceMode === "QUOTE_ONLY" || !service.price
      ? service.requiresSurvey
        ? "Priced after a free assessment"
        : "Priced once we&rsquo;ve seen photos"
      : service.priceMode === "PER_HOUR"
        ? `${formatMoney(service.price.toString())} per hour`
        : service.priceMode === "FROM"
          ? `From ${formatMoney(service.price.toString())}`
          : formatMoney(service.price.toString());

  const waMessage = service.whatsappPrompt ?? `Hi, I'd like a quote for a ${service.name}.`;

  return (
    <>
      <JsonLd
        data={[
          serviceJsonLd({
            name: service.name,
            slug: service.slug,
            summary: service.summary,
            price: service.price ? Number(service.price) : null,
            priceMode: service.priceMode,
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Services", path: "/services" },
            { name: service.name, path: `/services/${service.slug}` },
          ]),
          ...(faqs.length ? [faqJsonLd(faqs)] : []),
        ]}
      />

      <header className="relative isolate overflow-hidden bg-forest-deep text-white">
        {service.heroImage && (
          <>
            <Image src={service.heroImage} alt="" fill priority sizes="100vw" className="object-cover opacity-40" />
            <div className="absolute inset-0 bg-gradient-to-r from-forest-deep via-forest-deep/90 to-forest-deep/50" />
          </>
        )}
        <div className="shell relative py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-white/60">
            <Link href="/" className="hover:text-champagne">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <Link href="/services" className="hover:text-champagne">Services</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-white">{service.name}</span>
          </nav>

          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.08] md:text-[3.25rem]">{service.name}</h1>
          <p className="mt-5 max-w-[58ch] text-[1.0625rem] leading-relaxed text-white/75 md:text-lg">{service.summary}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-champagne px-4 py-2 text-[0.9375rem] font-semibold text-[#241a06]">
              {headlinePrice}
            </span>
            {service.negotiable && <Badge variant="outline" className="border-white/30 text-white">Price negotiable</Badge>}
            {service.minimumCharge && <Badge variant="outline" className="border-white/30 text-white">{service.minimumCharge}</Badge>}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="whatsapp">
              <a href={whatsappLink(settings.whatsapp, waMessage)} target="_blank" rel="noopener noreferrer">
                Get a price on WhatsApp
              </a>
            </Button>
            <Button asChild size="lg" className="border border-white/25 bg-white/10 text-white hover:bg-white/20">
              <a href="#book">{service.requiresSurvey ? "Book a free assessment" : "Start a booking"}</a>
            </Button>
          </div>

          {service.tags.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2">
              {service.tags.map((tag) => (
                <li key={tag} className="rounded-full border border-white/20 px-3 py-1 text-xs text-white/70">
                  {tag}
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <div className="shell grid gap-14 py-16 md:py-24 lg:grid-cols-[1.4fr_1fr] lg:gap-20">
        <div>
          <div className="prose-sofresh text-[1.0625rem]">
            {paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>

          {(service.includes.length > 0 || service.excludes.length > 0) && (
            <div className="mt-14 grid gap-10 sm:grid-cols-2">
              {service.includes.length > 0 && (
                <section aria-labelledby="includes">
                  <h2 id="includes" className="font-display text-xl">What&rsquo;s included</h2>
                  <ul className="mt-5 space-y-3">
                    {service.includes.map((item) => (
                      <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-sage">
                        <Check className="mt-1 size-4 shrink-0 text-verdant" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {service.excludes.length > 0 && (
                <section aria-labelledby="excludes">
                  <h2 id="excludes" className="font-display text-xl">Not included unless quoted</h2>
                  <ul className="mt-5 space-y-3">
                    {service.excludes.map((item) => (
                      <li key={item} className="flex gap-3 text-[0.9375rem] leading-relaxed text-sage">
                        <Minus className="mt-1 size-4 shrink-0 text-champagne" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-5 text-sm leading-relaxed text-sage">
                    Any of these can be added — just ask when you enquire and we&rsquo;ll price them into the job.
                  </p>
                </section>
              )}
            </div>
          )}

          {service.images.length > 0 && (
            <section className="mt-14" aria-labelledby="service-gallery">
              <h2 id="service-gallery" className="font-display text-xl">From recent jobs</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {service.images.map((image) => (
                  <figure key={image.id} className="overflow-hidden rounded-2xl border border-border bg-mist">
                    <div className="relative aspect-[4/3]">
                      <Image
                        src={image.url}
                        alt={image.alt || service.name}
                        fill
                        sizes="(max-width: 768px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                    {image.caption && (
                      <figcaption className="px-4 py-3 text-sm text-sage">{image.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
          )}

          {faqs.length > 0 && (
            <section className="mt-14" aria-labelledby="service-faq">
              <h2 id="service-faq" className="font-display text-2xl">About this service</h2>
              <Accordion type="single" collapsible className="mt-5 border-t border-border">
                {faqs.map((faq) => (
                  <AccordionItem key={faq.q} value={faq.q}>
                    <AccordionTrigger>{faq.q}</AccordionTrigger>
                    <AccordionContent>{faq.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          )}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-2xl border border-border bg-white p-6 md:p-7">
            <h2 className="font-display text-lg">The practical details</h2>
            <dl className="mt-5 space-y-5">
              {service.durationEstimate && (
                <Detail icon={Clock} term="How long it takes">{service.durationEstimate}</Detail>
              )}
              <Detail icon={CalendarClock} term="Notice we need">
                {service.noticeHours >= 24
                  ? `${Math.round(service.noticeHours / 24)} day${service.noticeHours >= 48 ? "s" : ""} preferred`
                  : `${service.noticeHours} hours`}
                . Short notice is often possible — ask.
              </Detail>
              <Detail icon={Camera} term="How we price it">
                {service.requiresSurvey
                  ? "We come and look first, free of charge, then send a fixed price."
                  : "Send photos or a short video and we'll send a fixed price, normally within 24 hours."}
              </Detail>
            </dl>

            <div className="mt-6 border-t border-border pt-6">
              <p className="text-[0.9375rem] leading-relaxed text-sage">{settings.bookingFeeNote}</p>
              <Button asChild className="mt-5 w-full" size="lg">
                <a href="#book">{service.requiresSurvey ? "Book a free assessment" : "Start a booking"}</a>
              </Button>
            </div>
          </div>
        </aside>
      </div>

      <section id="book" className="scroll-mt-24 border-t border-border bg-mist py-16 md:py-24" aria-labelledby="book-heading">
        <div className="shell max-w-3xl">
          <h2 id="book-heading" className="font-display text-[2rem] leading-tight md:text-[2.5rem]">
            Request your {service.name.toLowerCase()}
          </h2>
          <p className="mt-4 max-w-[58ch] text-[1.0625rem] leading-relaxed text-sage">
            Six short steps. Nothing is charged and no date is held until we&rsquo;ve sent you a price and you&rsquo;ve accepted it.
          </p>
          <div className="mt-10 rounded-2xl border border-border bg-white p-6 md:p-9">
            <BookingWizard
              services={wizardServices}
              preselectedSlug={service.slug}
              prefill={
                user
                  ? {
                      name: user.name,
                      email: user.email,
                      phone: user.phone ?? undefined,
                      postcode: user.postcode ?? undefined,
                      addressLine1: user.addressLine1 ?? undefined,
                      city: user.city ?? undefined,
                    }
                  : undefined
              }
              cancellationHours={settings.cancellationHours}
              bookingFeeNote={settings.bookingFeeNote}
            />
          </div>
        </div>
      </section>

      <StickyContactBar whatsapp={settings.whatsapp} message={waMessage} bookHref="#book" bookLabel="Start booking" />
    </>
  );
}

function Detail({
  icon: Icon,
  term,
  children,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3.5">
      <Icon className="mt-0.5 size-5 shrink-0 text-champagne" strokeWidth={1.75} />
      <div>
        <dt className="text-sm text-sage">{term}</dt>
        <dd className="mt-0.5 text-[0.9375rem] leading-relaxed text-ink">{children}</dd>
      </div>
    </div>
  );
}
