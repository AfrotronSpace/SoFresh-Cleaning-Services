import Link from "next/link";
import type { Metadata } from "next";
import { ImageOff, Play } from "lucide-react";
import { PageHeader, EmptyState } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { isR2PublicConfigured, publicObjectUrl } from "@/lib/r2";
import { jobTitle } from "@/lib/gallery-data";
import { setGalleryJobPublishedAction } from "@/app/actions/admin";
import { cn, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Gallery", robots: { index: false, follow: false } };

const FILTERS = [
  { key: "all", label: "All" },
  { key: "drafts", label: "Drafts" },
  { key: "live", label: "Live" },
] as const;

export default async function AdminGalleryPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireAdmin();
  const { show } = await searchParams;
  const filter = FILTERS.find((f) => f.key === show)?.key ?? "all";

  const [jobs, counts, inboxCount] = await Promise.all([
    prisma.galleryJob.findMany({
      where: filter === "drafts" ? { published: false } : filter === "live" ? { published: true } : {},
      orderBy: [{ published: "asc" }, { updatedAt: "desc" }],
      take: 200,
      include: {
        service: { select: { name: true } },
        media: { orderBy: { sortOrder: "asc" }, select: { layout: true, primaryType: true, primaryKey: true, primaryPoster: true } },
      },
    }),
    prisma.galleryJob.groupBy({ by: ["published"], _count: true }),
    prisma.galleryInboxItem.count(),
  ]);

  const total = counts.reduce((n, c) => n + c._count, 0);
  const drafts = counts.find((c) => !c.published)?._count ?? 0;
  const storageReady = isR2PublicConfigured();

  return (
    <>
      <PageHeader
        title="Gallery"
        description="Completed jobs shown on /gallery. Got a big unsorted batch? Put it in the inbox, then build jobs from it."
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="ghost">
              <Link href="/gallery" target="_blank">View gallery</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/admin/gallery/new">Add a job</Link>
            </Button>
            <Button asChild>
              <Link href="/admin/gallery/inbox">Inbox{inboxCount > 0 ? ` (${inboxCount})` : ""}</Link>
            </Button>
          </div>
        }
      />

      {!storageReady && (
        <p className="mb-6 rounded-xl border border-champagne/60 bg-champagne-soft/20 px-5 py-4 text-sm leading-relaxed text-ink">
          Photo storage isn&rsquo;t configured, so uploads are switched off and existing media can&rsquo;t be shown. Set{" "}
          <code>R2_PUBLIC_BUCKET</code> and <code>NEXT_PUBLIC_R2_PUBLIC_HOST</code> — see docs/DEPLOYMENT.md.
        </p>
      )}

      {inboxCount > 0 && (
        <Link
          href="/admin/gallery/inbox"
          className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-5 py-4 text-sm transition-colors hover:bg-haze/60"
        >
          <span className="text-ink">
            <strong className="font-semibold">{inboxCount}</strong> file{inboxCount === 1 ? " is" : "s are"} waiting in the
            inbox to be sorted into jobs.
          </span>
          <span className="font-medium text-verdant">Open the inbox →</span>
        </Link>
      )}

      {total > 0 && (
        <nav aria-label="Filter jobs" className="mb-6 flex gap-2">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={f.key === "all" ? "/admin/gallery" : `/admin/gallery?show=${f.key}`}
              aria-current={filter === f.key ? "page" : undefined}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.key ? "border-forest bg-forest text-white" : "border-border bg-white text-sage hover:text-forest",
              )}
            >
              {f.label}
              {f.key === "drafts" && drafts > 0 && ` (${drafts})`}
            </Link>
          ))}
        </nav>
      )}

      {jobs.length === 0 ? (
        <EmptyState
          title={total === 0 ? "No jobs yet" : "Nothing here"}
          body={
            total === 0
              ? "Upload a whole batch to the inbox and group it into jobs, or add a single job directly. Jobs stay drafts until you switch them on."
              : "No jobs match this filter."
          }
          action={
            total === 0 ? (
              <div className="flex justify-center gap-2">
                <Button asChild>
                  <Link href="/admin/gallery/inbox">Open the inbox</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/admin/gallery/new">Add a job</Link>
                </Button>
              </div>
            ) : undefined
          }
        />
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {jobs.map((job) => {
            const cover = job.media[0];
            const thumbKey = cover ? (cover.primaryType === "VIDEO" ? cover.primaryPoster : cover.primaryKey) : null;
            const thumb = thumbKey ? publicObjectUrl(thumbKey) : null;
            const pairs = job.media.filter((m) => m.layout === "BEFORE_AFTER").length;
            const meta = [job.service?.name, job.area, job.completedOn && formatDate(job.completedOn, { day: undefined, timeZone: "UTC" })]
              .filter(Boolean)
              .join(" · ");

            return (
              <li key={job.id} className="overflow-hidden rounded-2xl border border-border bg-white">
                <Link href={`/admin/gallery/${job.id}`} className="block transition-colors hover:bg-haze/60">
                  <div className="relative aspect-[4/3] bg-mist">
                    {thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumb} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sage">
                        {cover?.primaryType === "VIDEO" ? <Play className="size-6" /> : <ImageOff className="size-6" strokeWidth={1.5} />}
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      {!job.published && <Badge variant="neutral">Draft</Badge>}
                      {job.featured && <Badge variant="accent">Featured</Badge>}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-ink">{job.title || jobTitle(job)}</p>
                    <p className="mt-0.5 text-sm text-sage">
                      {job.media.length} item{job.media.length === 1 ? "" : "s"}
                      {pairs > 0 && ` · ${pairs} before & after`}
                    </p>
                    {meta && <p className="mt-0.5 truncate text-sm text-sage">{meta}</p>}
                  </div>
                </Link>
                <form action={setGalleryJobPublishedAction} className="border-t border-border px-4 py-2.5">
                  <input type="hidden" name="id" value={job.id} />
                  <input type="hidden" name="published" value={job.published ? "false" : "true"} />
                  <Button type="submit" variant="ghost" size="sm" className="w-full" disabled={!job.published && job.media.length === 0}>
                    {job.published ? "Take off the website" : job.media.length === 0 ? "Add media to publish" : "Publish"}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
