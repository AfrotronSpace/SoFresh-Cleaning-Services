import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

const DEFAULT_DESCRIPTION =
  "Premium, detail-led cleaning across Essex and Suffolk. Restoration deep cleans, end of tenancy, after-builders and commercial cleaning. Fixed prices from photos, usually within 24 hours.";

export function buildMetadata(opts: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = new URL(opts.path ?? "/", SITE.url).toString();
  const description = opts.description ?? DEFAULT_DESCRIPTION;
  const image = opts.image ?? "/opengraph-image.png";

  return {
    title: opts.title,
    description,
    alternates: { canonical: url },
    robots: opts.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: opts.title,
      description,
      url,
      siteName: SITE.name,
      locale: "en_GB",
      type: opts.type ?? "website",
      images: [{ url: image, width: 1200, height: 630, alt: opts.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description,
      images: [image],
    },
  };
}

/** LocalBusiness schema. The registered office is intentionally omitted. */
export function localBusinessJsonLd(settings: {
  businessName: string;
  phone: string;
  email: string;
  serviceAreas: string[];
  openingHours: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "@id": `${SITE.url}/#business`,
    name: settings.businessName,
    legalName: SITE.legalName,
    url: SITE.url,
    telephone: settings.phone,
    email: settings.email,
    image: `${SITE.url}/opengraph-image.png`,
    logo: `${SITE.url}/icon.svg`,
    priceRange: "££",
    foundingDate: String(SITE.founded),
    address: { "@type": "PostalAddress", addressRegion: "Essex", addressCountry: "GB" },
    areaServed: settings.serviceAreas.map((name) => ({ "@type": "City", name })),
    knowsAbout: [
      "Restoration deep cleaning",
      "End of tenancy cleaning",
      "After builders cleaning",
      "Probate and pre-sale cleaning",
      "Commercial office cleaning",
    ],
    openingHours: "Mo-Su",
    description: settings.openingHours,
  };
}

export function serviceJsonLd(service: {
  name: string;
  slug: string;
  summary: string;
  price?: number | null;
  priceMode: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.summary,
    url: `${SITE.url}/services/${service.slug}`,
    serviceType: service.name,
    provider: { "@id": `${SITE.url}/#business` },
    areaServed: { "@type": "AdministrativeArea", name: "Essex and Suffolk" },
    ...(service.price
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "GBP",
            price: service.price,
            ...(service.priceMode === "FROM" ? { priceSpecification: { "@type": "PriceSpecification", minPrice: service.price, priceCurrency: "GBP" } } : {}),
          },
        }
      : {}),
  };
}

export function faqJsonLd(faqs: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };
}

export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, SITE.url).toString(),
    })),
  };
}
