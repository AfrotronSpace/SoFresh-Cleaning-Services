import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { ServiceForm } from "@/components/admin/service-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { deleteServiceAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit service", robots: { index: false, follow: false } };

export default async function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const service = await prisma.service.findUnique({ where: { id } });
  if (!service) notFound();

  const extras = Array.isArray(service.extras) ? (service.extras as { name: string }[]) : [];

  return (
    <>
      <PageHeader
        title={service.name}
        description={`Live at /services/${service.slug}`}
        action={
          <div className="flex gap-2">
            <Button asChild variant="ghost">
              <Link href={`/services/${service.slug}`} target="_blank">View page</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/admin/services">Back</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        <ServiceForm
          initial={{
            id: service.id,
            name: service.name,
            slug: service.slug,
            summary: service.summary,
            body: service.body,
            group: service.group,
            propertyKind: service.propertyKind,
            priceMode: service.priceMode,
            price: service.price ? service.price.toString() : "",
            negotiable: service.negotiable,
            minimumCharge: service.minimumCharge ?? "",
            includes: service.includes.join("\n"),
            excludes: service.excludes.join("\n"),
            extras: extras.map((e) => e.name).join("\n"),
            durationEstimate: service.durationEstimate ?? "",
            noticeHours: service.noticeHours,
            requiresSurvey: service.requiresSurvey,
            photosRecommended: service.photosRecommended,
            heroImage: service.heroImage ?? "",
            whatsappPrompt: service.whatsappPrompt ?? "",
            featured: service.featured,
            active: service.active,
            sortOrder: service.sortOrder,
            seoTitle: service.seoTitle ?? "",
            seoDescription: service.seoDescription ?? "",
          }}
        />

        {service.active && (
          <form action={deleteServiceAction} className="rounded-2xl border border-border bg-white p-6">
            <input type="hidden" name="id" value={service.id} />
            <h2 className="font-display text-lg">Take this off the website</h2>
            <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-sage">
              Hides it from the catalogue and the booking form. Past bookings keep their record, and you can switch it back on
              at any time.
            </p>
            <Button type="submit" variant="outline" className="mt-5">Hide this service</Button>
          </form>
        )}
      </div>
    </>
  );
}
