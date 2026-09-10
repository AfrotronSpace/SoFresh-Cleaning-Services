import Link from "next/link";
import type { Metadata } from "next";
import { ImageOff } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SERVICE_ICONS } from "@/components/admin/icon-select";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { SERVICE_GROUPS } from "@/lib/constants";
import { formatMoney } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Services", robots: { index: false, follow: false } };

export default async function AdminServicesPage() {
  await requireAdmin();
  const services = await prisma.service.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { images: { take: 1, orderBy: { sortOrder: "asc" } } },
  });

  return (
    <>
      <PageHeader
        title="Services"
        description="What appears in the catalogue and what customers can book. Changes go live immediately."
        action={
          <Button asChild>
            <Link href="/admin/services/new">Add a service</Link>
          </Button>
        }
      />

      {services.length === 0 ? (
        <EmptyState
          title="No services yet"
          body="Add your first service and it'll appear in the catalogue and the booking form straight away."
          action={
            <Button asChild>
              <Link href="/admin/services/new">Add a service</Link>
            </Button>
          }
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-white">
          <ul className="divide-y divide-border">
            {services.map((service) => {
              const thumb = service.heroImage ?? service.images[0]?.url ?? null;
              const Icon = service.icon ? SERVICE_ICONS[service.icon] : null;
              return (
                <li key={service.id}>
                  <Link
                    href={`/admin/services/${service.id}`}
                    className="flex flex-wrap items-center gap-x-6 gap-y-2 p-5 transition-colors hover:bg-haze/60"
                  >
                    <div className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mist">
                      {thumb ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={thumb} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-sage">
                          <ImageOff className="size-4" strokeWidth={1.5} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-medium text-ink">
                        {Icon && <Icon className="size-4 shrink-0 text-forest" strokeWidth={1.75} />}
                        {service.name}
                        {service.featured && <Badge variant="accent">Featured</Badge>}
                        {!service.active && <Badge variant="neutral">Hidden</Badge>}
                        {service.negotiable && <Badge variant="outline">Negotiable</Badge>}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-sage">{service.summary}</p>
                    </div>
                    <p className="text-sm text-sage">{SERVICE_GROUPS[service.group].label}</p>
                    <p className="w-28 text-sm font-medium text-forest">
                      {service.price
                        ? `${service.priceMode === "FROM" ? "from " : ""}${formatMoney(service.price.toString())}${service.priceMode === "PER_HOUR" ? "/hr" : ""}`
                        : "Quote only"}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}
