import Link from "next/link";
import type { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/site/json-ld";
import { prisma } from "@/lib/prisma";
import { loadSettings } from "@/lib/settings";
import { buildMetadata, breadcrumbJsonLd } from "@/lib/seo";
import { slugify, whatsappLink } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = buildMetadata({
  title: "Areas we cover",
  description:
    "So Fresh Cleaning Service covers Colchester, Ipswich, Dedham, Clacton-on-Sea, Braintree, Brentwood, Frinton-on-Sea and the surrounding area across Essex and Suffolk.",
  path: "/areas",
});

export default async function AreasPage() {
  const settings = await loadSettings();
  const areas = await prisma.areaCovered
    .findMany({ where: { active: true }, orderBy: [{ priority: "desc" }, { sortOrder: "asc" }] })
    .catch(() => []);

  const list = areas.length
    ? areas
    : settings.serviceAreas.map((name) => ({
        id: name,
        slug: slugify(name),
        name,
        county: "Essex",
        blurb: null as string | null,
        priority: false,
        active: true,
        sortOrder: 100,
      }));

  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Areas we cover", path: "/areas" }])} />

      <header className="border-b border-border bg-mist">
        <div className="shell py-16 md:py-24">
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-sage">
            <Link href="/" className="hover:text-forest">Home</Link>
            <span className="px-2 text-champagne">/</span>
            <span className="text-ink">Areas we cover</span>
          </nav>
          <h1 className="max-w-3xl font-display text-[2.25rem] leading-[1.1] md:text-[3.25rem]">
            Essex, Suffolk, and everywhere in between
          </h1>
          <p className="mt-6 max-w-[62ch] text-[1.0625rem] leading-relaxed text-sage md:text-lg">
            We&rsquo;re based in Colchester. If you&rsquo;re outside the towns below, ask anyway — travel, a minimum booking or a
            slightly higher quote may apply depending on the distance and the size of the job.
          </p>
        </div>
      </header>

      <div className="shell py-16 md:py-24">
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((area) => (
            <li key={area.slug}>
              <Link
                href={`/areas/${area.slug}`}
                className="seam group block h-full rounded-xl border border-border bg-white p-6 pl-7 transition-shadow hover:shadow-[var(--shadow-lift)]"
              >
                <h2 className="font-display text-xl text-ink">{area.name}</h2>
                <p className="mt-1 text-sm text-sage">{area.county}</p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-sage">
                  {area.blurb ?? `Restoration deep cleans, end of tenancy and commercial cleaning across ${area.name}.`}
                </p>
                <span className="mt-4 block text-sm font-medium text-verdant underline-offset-4 group-hover:underline">
                  Cleaning in {area.name}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 rounded-2xl bg-mist p-8 md:p-10">
          <h2 className="font-display text-2xl leading-tight">Not on the list?</h2>
          <p className="mt-3 max-w-[54ch] text-[0.9375rem] leading-relaxed text-sage">
            Send us your postcode. We travel for the right job, and we&rsquo;ll tell you honestly if it doesn&rsquo;t work.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="whatsapp" size="lg">
              <a href={whatsappLink(settings.whatsapp, "Hi, do you cover my postcode?")} target="_blank" rel="noopener noreferrer">
                Ask about your postcode
              </a>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/book">Request a booking</Link>
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
