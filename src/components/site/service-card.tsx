import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Sparkle } from "@/components/site/ornaments";
import { formatMoney, cn } from "@/lib/utils";
import type { PriceMode } from "@prisma/client";

export type ServiceCardData = {
  slug: string;
  name: string;
  summary: string;
  price: string | number | null;
  priceMode: PriceMode;
  negotiable: boolean;
  requiresSurvey: boolean;
  heroImage: string | null;
};

function priceLabel(service: ServiceCardData) {
  if (service.priceMode === "QUOTE_ONLY" || service.price === null) {
    return service.requiresSurvey ? "Priced after a free assessment" : "Priced from your photos";
  }
  const money = formatMoney(service.price);
  if (service.priceMode === "PER_HOUR") return `${money} per hour`;
  if (service.priceMode === "FROM") return `from ${money}`;
  return money ?? "";
}

export function ServiceCard({ service, feature = false }: { service: ServiceCardData; feature?: boolean }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-[0_1px_2px_rgb(6_42_29/0.04)] transition-[box-shadow,transform,border-color] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:border-champagne/60 hover:shadow-[var(--shadow-float)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        feature && "md:flex-row",
      )}
    >
      <div className={cn("relative aspect-[16/10] w-full overflow-hidden bg-mist", feature && "md:aspect-auto md:min-h-[26rem] md:w-[55%]")}>
        {service.heroImage ? (
          <Image
            src={service.heroImage}
            alt=""
            fill
            sizes={feature ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.07]"
          />
        ) : (
          <div className="grain absolute inset-0" />
        )}
        {/* A soft emerald floor so the photograph sits in the palette. */}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-forest-deep/45 via-transparent to-transparent" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-2.5 rounded-[1.1rem] border border-champagne/0 transition-colors duration-700 group-hover:border-champagne/70"
        />
        {feature && (
          <span className="bg-gold absolute left-5 top-5 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#241a06] shadow-[var(--shadow-gold)]">
            <Sparkle className="size-2.5" />
            Our signature service
          </span>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col p-6 md:p-7", feature && "md:justify-center md:p-10 lg:p-12")}>
        <h3 className={cn("font-display font-semibold leading-[1.1] text-ink", feature ? "text-[1.75rem] md:text-[2.5rem]" : "text-2xl")}>
          {service.name}
        </h3>
        <p className={cn("mt-3 flex-1 text-[0.9375rem] leading-relaxed text-sage", feature && "md:flex-none md:text-[1.0625rem]")}>
          {service.summary}
        </p>

        <div className={cn("mt-6 flex flex-wrap items-center gap-2 border-t border-border pt-5", feature && "md:mt-8")}>
          <span className={cn("font-display font-semibold text-forest", feature ? "text-2xl" : "text-xl")}>{priceLabel(service)}</span>
          {service.negotiable && <Badge variant="accent">Negotiable</Badge>}
          {service.requiresSurvey && <Badge variant="outline">Assessment first</Badge>}
        </div>

        <span className="mt-5 inline-flex items-center gap-2 text-[0.8125rem] font-medium uppercase tracking-[0.14em] text-emerald">
          <span className="link-draw pb-0.5">See what&rsquo;s included</span>
          <ArrowRight className="size-4 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1.5" />
        </span>
      </div>
    </Link>
  );
}
