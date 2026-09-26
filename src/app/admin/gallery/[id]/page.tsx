import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { GalleryJobForm } from "@/components/admin/gallery-job-form";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";
import { isR2PublicConfigured } from "@/lib/r2";
import { jobTitle, toEditorFrames } from "@/lib/gallery-data";
import { deleteGalleryJobAction } from "@/app/actions/admin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit gallery job", robots: { index: false, follow: false } };

export default async function EditGalleryJobPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const [job, services, settings] = await Promise.all([
    prisma.galleryJob.findUnique({
      where: { id },
      include: { media: { orderBy: { sortOrder: "asc" } }, service: { select: { name: true } } },
    }),
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    loadSettings(),
  ]);
  if (!job) notFound();

  // A job linked to a since-hidden service keeps its link visible in the picker.
  const serviceOptions =
    job.serviceId && !services.some((s) => s.id === job.serviceId)
      ? [...services, { id: job.serviceId, name: `${job.service?.name ?? "Hidden service"} (hidden)` }]
      : services;

  return (
    <>
      <PageHeader
        title={job.title || jobTitle(job)}
        description={job.published ? "Live on the gallery." : "Draft — not on the website yet."}
        action={
          <div className="flex gap-2">
            {job.published && (
              <Button asChild variant="ghost">
                <Link href={`/gallery?job=${job.id}`} target="_blank">View on site</Link>
              </Button>
            )}
            <Button asChild variant="ghost">
              <Link href="/admin/gallery">Back</Link>
            </Button>
          </div>
        }
      />

      <div className="max-w-3xl space-y-6">
        <GalleryJobForm
          services={serviceOptions}
          areas={settings.serviceAreas}
          uploadsEnabled={isR2PublicConfigured()}
          initial={{
            id: job.id,
            title: job.title ?? "",
            description: job.description ?? "",
            completedOn: job.completedOn ? job.completedOn.toISOString().slice(0, 10) : "",
            area: job.area ?? "",
            serviceId: job.serviceId ?? "",
            published: job.published,
            featured: job.featured,
            media: toEditorFrames(job.media),
          }}
        />

        <form action={deleteGalleryJobAction} className="rounded-2xl border border-border bg-white p-6">
          <input type="hidden" name="id" value={job.id} />
          <h2 className="font-display text-lg">Delete this job</h2>
          <p className="mt-2 max-w-[62ch] text-[0.9375rem] leading-relaxed text-sage">
            Removes it from the gallery and permanently deletes its photos and videos from storage. To hide it without losing
            anything, switch off &ldquo;Show on the website&rdquo; instead.
          </p>
          <ConfirmSubmit className="mt-5" message="Delete this job and permanently remove its photos and videos? This can't be undone.">
            Delete job and files
          </ConfirmSubmit>
        </form>
      </div>
    </>
  );
}
