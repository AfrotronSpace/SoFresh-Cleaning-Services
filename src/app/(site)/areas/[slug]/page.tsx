import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ServiceCard, type ServiceCardData } from "@/components/site/service-card";
import { StickyContactBar } from "@/components/site/sticky-contact-bar";
import { JsonLd } from "@/components/site/json-ld";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { slugify, whatsappLink } from "@/lib/utils";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

async function resolveArea(slug: string) {
  const row = await prisma.areaCovered.findFirst({ where: { slug, active: true } }).catch(() => null);
  if (row) return { name: row.name, county: row.county, blurb: row.blurb };

  const settings = await loadSettings();
  const match = settings.serviceAreas.find((a) => slugify(a) === slug);
  return match ? { name: match, county: "Essex", blurb: null } : null;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const area = await resolveArea(slug);
  if (!area) return buildMetadata({ title: "Area not found", path: `/areas/${slug}`, noIndex: true });

  return buildMetadata({
    title: `Cleaning in ${area.name}`,
    description: `Deep cleaning, end of tenancy cleaning and commercial cleaning in ${area.name}, ${area.county}. Fixed prices from photos, usually within 24 hours. So Fresh Cleaning Service.`,
    path: `/areas/${slug}`,
  });
}

export default async function AreaPage({ params }: Params) {
  const { slug } = await params;
  const [area, settings] = await Promise.all([resolveArea(slug), loadSettings()]);
  if (!area) notFound();

  const services = await prisma.service
    .findMany({
      where: { active: true },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
      take: 6,
      select: { slug: true, name: true, summary: true, price: true, priceMode: true, negotiable: true, requiresSurvey: true, heroImage: true },
    })
    .catch(() => []);

  const cards: ServiceCardData[] = services.map((s) => ({ ...s, price: s.price ? s.price.toString() : null }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Areas we cover", path: "/areas" },
          { name: area.name, path: `/areas/${slug}` },
        ])}
      />

      <header className="border-b border-border bg-mist">
        <div className="shell py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <Link href="/areas" className="hover:text-forest">Areas</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">{area.name}</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.1] md:text-[3.25rem]">
            Deep cleaning in {area.name}
          </h1>
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            {area.blurb ??
              `So Fresh is a ${SITE.founded}-founded, Colchester-based cleaning company working across ${area.county}. We take on the labour-intensive jobs in ${area.name} that most cleaners turn down — restoration deep cleans, end of tenancy, after-builders and commercial work.`}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" variant="whatsapp">
              <a href={whatsappLink(settings.whatsapp, `Hi, I'd like a quote for a clean in ${area.name}.`)} target="_blank" rel="noopener noreferrer">
                Get a price for {area.name}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/book">Request a booking</Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="shell py-16 md:py-24">
        <h2 className="font-display text-2xl leading-tight md:text-[2rem]">What we clean in {area.name}</h2>
        <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((service) => (
            <ServiceCard key={service.slug} service={service} />
          ))}
        </div>

        <div className="mt-14 max-w-[68ch] space-y-4 text-[1.0625rem] leading-relaxed text-sage">
          <h2 className="font-display text-2xl leading-tight text-ink">How pricing works here</h2>
          <p>
            We price on the condition of the property, the scope of work and the result you need — not on bedroom count or an
            hourly rate that creeps up on the day. Send photos or a short walkthrough video and we&rsquo;ll come back with a fixed
            price, normally within 24 hours.
          </p>
          <p>
            {area.name === "Colchester"
              ? "Colchester is our home patch, so we can often be flexible on dates and take on short-notice work here."
              : `${area.name} is well within our normal working area. Travel or a minimum booking may apply on smaller jobs — we'll always tell you up front.`}
          </p>
        </div>

        <p className="mt-10 text-[0.9375rem] text-sage">
          Also covering{" "}
          {settings.serviceAreas
            .filter((a) => a !== area.name)
            .map((a, i, arr) => (
              <span key={a}>
                <Link href={`/areas/${slugify(a)}`} className="text-verdant underline underline-offset-4">
                  {a}
                </Link>
                {i < arr.length - 1 ? ", " : "."}
              </span>
            ))}
        </p>
      </div>

      <StickyContactBar whatsapp={settings.whatsapp} message={`Hi, I'd like a quote for a clean in ${area.name}.`} />
    </>
  );
}
