import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
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
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white transition-shadow duration-300 hover:shadow-[var(--shadow-lift)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        feature && "md:col-span-2 md:flex-row",
      )}
    >
      <div className={cn("relative aspect-[16/10] w-full overflow-hidden bg-mist", feature && "md:aspect-auto md:w-1/2")}>
        {service.heroImage ? (
          <Image
            src={service.heroImage}
            alt=""
            fill
            sizes={feature ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 33vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grain absolute inset-0" />
        )}
        {feature && (
          <span className="absolute left-4 top-4 rounded-full bg-champagne px-3 py-1 text-xs font-medium text-[#241a06]">
            Our signature service
          </span>
        )}
      </div>

      <div className={cn("flex flex-1 flex-col p-5 md:p-6", feature && "md:justify-center md:p-9")}>
        <h3 className={cn("font-display font-medium leading-snug text-ink", feature ? "text-2xl md:text-3xl" : "text-xl")}>
          {service.name}
        </h3>
        <p className={cn("mt-2.5 flex-1 text-[0.9375rem] leading-relaxed text-sage", feature && "md:text-base")}>
          {service.summary}
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-[0.9375rem] font-semibold text-forest">{priceLabel(service)}</span>
          {service.negotiable && <Badge variant="accent">Negotiable</Badge>}
          {service.requiresSurvey && <Badge variant="outline">Assessment first</Badge>}
        </div>

        <span className="mt-4 text-sm font-medium text-verdant underline-offset-4 group-hover:underline">
          See what&rsquo;s included
        </span>
      </div>
    </Link>
  );
}
