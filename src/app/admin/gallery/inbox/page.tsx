import Link from "next/link";
import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-header";
import { GalleryInbox } from "@/components/admin/gallery-inbox";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isR2PublicConfigured } from "@/lib/r2";
import { getInboxItems, jobTitle } from "@/lib/gallery-data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery inbox", robots: { index: false, follow: false } };

export default async function GalleryInboxPage() {
  await requireAdmin();
  const [items, jobs] = await Promise.all([
    getInboxItems(),
    prisma.galleryJob.findMany({
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: { id: true, title: true, published: true, service: { select: { name: true } }, _count: { select: { media: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Inbox"
        description="Upload everything here first. Nothing in the inbox is on the website. Select files to start a job — or add them to one — then pair the before & afters in the job."
        action={
          <Button asChild variant="ghost">
            <Link href="/admin/gallery">Back to jobs</Link>
          </Button>
        }
      />
      <GalleryInbox
        initial={items}
        uploadsEnabled={isR2PublicConfigured()}
        jobs={jobs.map((j) => ({
          id: j.id,
          label: `${jobTitle(j)}${j.published ? "" : " — draft"}`,
          count: j._count.media,
        }))}
      />
    </>
  );
}
