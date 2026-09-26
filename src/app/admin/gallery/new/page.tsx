import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/admin/page-header";
import { GalleryJobForm } from "@/components/admin/gallery-job-form";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { loadSettings } from "@/lib/settings";
import { isR2PublicConfigured } from "@/lib/r2";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Add a gallery job", robots: { index: false, follow: false } };

export default async function NewGalleryJobPage() {
  await requireAdmin();
  const [services, settings] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { id: true, name: true } }),
    loadSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Add a job"
        description="Saved as a draft until you switch on “Show on the website”."
        action={
          <Button asChild variant="ghost">
            <Link href="/admin/gallery">Cancel</Link>
          </Button>
        }
      />
      <div className="max-w-3xl">
        <GalleryJobForm
          services={services}
          areas={settings.serviceAreas}
          uploadsEnabled={isR2PublicConfigured()}
          initial={{ title: "", description: "", completedOn: "", area: "", serviceId: "", published: false, featured: false, media: [] }}
        />
      </div>
    </>
  );
}
