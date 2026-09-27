import Link from "next/link";
import type { Metadata } from "next";
import { ServiceCard, type ServiceCardData } from "@/components/site/service-card";
import { StickyContactBar } from "@/components/site/sticky-contact-bar";
import { JsonLd } from "@/components/site/json-ld";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { SERVICE_GROUPS } from "@/lib/constants";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import type { ServiceGroup } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Service catalogue",
  description:
    "Every cleaning service So Fresh offers across Essex and Suffolk: restoration deep cleans, end of tenancy, after-builders, probate and pre-sale, commercial and office cleaning. What's included, what isn't, and how each one is priced.",
  path: "/services",
});

const ORDER: ServiceGroup[] = ["SIGNATURE", "TRANSITION", "COMMERCIAL"];

export default async function ServicesPage() {
  const settings = await loadSettings();
  const services = await prisma.service
    .findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        slug: true, name: true, summary: true, price: true, priceMode: true,
        negotiable: true, requiresSurvey: true, heroImage: true, group: true,
      },
    })
    .catch(() => []);

  const cards: (ServiceCardData & { group: ServiceGroup })[] = services.map((s) => ({
    ...s,
    price: s.price ? s.price.toString() : null,
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Services", path: "/services" },
        ])}
      />

      <header className="border-b border-border bg-mist">
        <div className="shell py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">Services</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.1] md:text-[3.25rem]">
            Everything we clean, and exactly what that includes
          </h1>
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            We specialise in labour-intensive, detail-led work: properties that need properly working through, not a quick
            surface clean. Each page below sets out the scope, what falls outside it, and how we work out the price.
          </p>
        </div>
      </header>

      <div className="shell py-16 md:py-24">
        {cards.length === 0 && (
          <p className="rounded-xl bg-mist p-6 text-[0.9375rem] text-sage">
            The catalogue is being set up. Message us on WhatsApp in the meantime and we&rsquo;ll talk it through.
          </p>
        )}

        {ORDER.map((group) => {
          const items = cards.filter((c) => c.group === group);
          if (!items.length) return null;
          return (
            <section key={group} className="mb-16 last:mb-0" aria-labelledby={`group-${group}`}>
              <div className="max-w-2xl">
                <h2 id={`group-${group}`} className="font-display text-2xl leading-tight md:text-[2rem]">
                  {SERVICE_GROUPS[group].label}
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-sage">{SERVICE_GROUPS[group].blurb}</p>
              </div>
              <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {items.map((service) => (
                  <ServiceCard key={service.slug} service={service} />
                ))}
              </div>
            </section>
          );
        })}

        <div className="mt-16 rounded-2xl border border-dashed border-champagne/70 bg-champagne-soft/20 p-8 md:p-10">
          <h2 className="font-display text-2xl leading-tight">None of these quite fit?</h2>
          <p className="mt-3 max-w-[58ch] text-[0.9375rem] leading-relaxed text-sage">
            Plenty of the work we take on doesn&rsquo;t sit neatly in a category. Describe the job in your own words and we&rsquo;ll build
            a price around it.
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link href="/book">Describe your job</Link>
          </Button>
        </div>
      </div>

      <StickyContactBar
        whatsapp={settings.whatsapp}
        message="Hi, I'd like a quote for a clean."
        bookHref="/book"
      />
    </>
  );
}
