"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { BeforeAfter } from "@/components/site/before-after";
import { JobCover, jobCounts, jobMeta } from "@/components/site/job-cover";
import { ReviewCard } from "@/components/site/reviews";
import { ReviewForm, type ReviewFormDefaults } from "@/components/site/review-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import type { PublicFrame, PublicJob, PublicSlot } from "@/lib/gallery";
import { whatsappLink } from "@/lib/utils";

const VIEWER_SIZES = "(max-width: 960px) 100vw, 900px";

function ratio(slot: PublicSlot) {
  return slot.width && slot.height ? slot.width / slot.height : undefined;
}

/** Videos never autoplay: the site allows one non-user-triggered animation, and it's the hero. */
function Media({ slot }: { slot: PublicSlot }) {
  if (slot.type === "VIDEO") {
    return (
      <video
        src={slot.url}
        poster={slot.poster ?? undefined}
        controls
        playsInline
        preload="none"
        aria-label={slot.alt}
        className="max-h-[75vh] w-full rounded-xl bg-forest-deep object-contain"
        style={{ aspectRatio: ratio(slot) ?? 16 / 9 }}
      />
    );
  }

  if (slot.width && slot.height) {
    return (
      <Image
        src={slot.url}
        alt={slot.alt}
        width={slot.width}
        height={slot.height}
        sizes={VIEWER_SIZES}
        className="mx-auto h-auto max-h-[75vh] w-auto max-w-full rounded-xl object-contain"
      />
    );
  }

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-mist">
      <Image src={slot.url} alt={slot.alt} fill sizes={VIEWER_SIZES} className="object-contain" />
    </div>
  );
}

function Frame({ frame }: { frame: PublicFrame }) {
  let body: React.ReactNode;

  if (frame.layout === "BEFORE_AFTER" && frame.secondary) {
    const pairRatio = ratio(frame.primary) ?? ratio(frame.secondary);
    body =
      frame.primary.type === "PHOTO" && frame.secondary.type === "PHOTO" ? (
        // Cap the width rather than the height, so a portrait pair keeps its shape instead of being cropped.
        <div className="mx-auto" style={pairRatio ? { maxWidth: `calc(75vh * ${pairRatio})` } : undefined}>
          <BeforeAfter
            before={frame.primary.url}
            after={frame.secondary.url}
            beforeAlt={frame.primary.alt}
            afterAlt={frame.secondary.alt}
            aspectRatio={pairRatio}
            sizes={VIEWER_SIZES}
            className="rounded-xl"
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["Before", frame.primary, "bg-forest-deep/80 text-white"],
            ["After", frame.secondary, "bg-champagne text-[#241a06]"],
          ] as const).map(([label, slot, tone]) => (
            <div key={label} className="relative">
              <Media slot={slot} />
              <span className={`pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${tone}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      );
  } else {
    body = <Media slot={frame.primary} />;
  }

  return (
    <figure>
      {body}
      {frame.caption && <figcaption className="mt-2.5 text-sm leading-relaxed text-sage">{frame.caption}</figcaption>}
    </figure>
  );
}

export function GalleryGrid({
  jobs: gridJobs,
  linkedJob,
  whatsapp,
  reviewDefaults,
  areas,
}: {
  jobs: PublicJob[];
  /** Opened on arrival from a ?job= link. May be from another page of results. */
  linkedJob?: PublicJob | null;
  whatsapp: string;
  reviewDefaults?: ReviewFormDefaults | null;
  areas?: string[];
}) {
  const jobs = linkedJob && !gridJobs.some((j) => j.id === linkedJob.id) ? [...gridJobs, linkedJob] : gridJobs;
  const [openId, setOpenId] = useState<string | null>(linkedJob?.id ?? null);
  // Tied to a job id so paging to the next job closes a half-written review.
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const index = jobs.findIndex((j) => j.id === openId);
  const job = index >= 0 ? jobs[index] : null;

  // Keep ?job= in the address bar so an open job can be shared or bookmarked.
  const select = useCallback((id: string | null) => {
    setOpenId(id);
    const url = new URL(window.location.href);
    if (id) url.searchParams.set("job", id);
    else url.searchParams.delete("job");
    window.history.replaceState(null, "", url);
  }, []);

  return (
    <>
      <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {gridJobs.map((j, i) => (
          <li key={j.id}>
            <a
              href={`?job=${j.id}`}
              aria-label={`${j.title}${jobMeta(j) ? `, ${jobMeta(j)}` : ""} — ${jobCounts(j)}`}
              className="group block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                e.preventDefault();
                select(j.id);
              }}
            >
              <JobCover job={j} priority={i < 3} />
            </a>
          </li>
        ))}
      </ul>

      <Dialog open={job !== null} onOpenChange={(open) => !open && select(null)}>
        {job && (
          <DialogContent className="max-w-4xl gap-0 p-0">
            <div className="border-b border-border px-6 pb-5 pt-6 pr-14 md:px-8">
              <DialogTitle className="text-2xl">{job.title}</DialogTitle>
              <DialogDescription className="mt-1">
                {[jobMeta(job), jobCounts(job)].filter(Boolean).join(" · ")}
              </DialogDescription>
              {job.description && (
                <p className="mt-4 max-w-[68ch] whitespace-pre-line text-[0.9375rem] leading-relaxed text-ink/80">{job.description}</p>
              )}
            </div>

            <div className="space-y-8 px-6 py-6 md:px-8">
              {job.frames.map((frame) => (
                <Frame key={frame.id} frame={frame} />
              ))}
            </div>

            <section aria-labelledby="job-reviews-heading" className="border-t border-border px-6 py-6 md:px-8">
              <h3 id="job-reviews-heading" className="font-display text-xl">
                {job.reviews.length ? "What the customer said" : "Was this your job?"}
              </h3>
              {job.reviews.length > 0 && (
                <ul className="mt-4 grid gap-4 sm:grid-cols-2">
                  {job.reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </ul>
              )}
              {reviewingId === job.id ? (
                <div className="mt-5">
                  <ReviewForm key={job.id} job={{ id: job.id, title: job.title }} defaults={reviewDefaults} areas={areas} />
                </div>
              ) : (
                <Button variant="outline" size="sm" className="mt-4" onClick={() => setReviewingId(job.id)}>
                  Review this job
                </Button>
              )}
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-haze/60 px-6 py-4 md:px-8">
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" disabled={index <= 0} onClick={() => select(jobs[index - 1].id)}>
                  <ChevronLeft className="size-4" /> Previous
                </Button>
                <Button variant="ghost" size="sm" disabled={index >= jobs.length - 1} onClick={() => select(jobs[index + 1].id)}>
                  Next <ChevronRight className="size-4" />
                </Button>
              </div>
              <Button asChild variant="whatsapp" size="sm">
                <a
                  href={whatsappLink(
                    whatsapp,
                    `Hi, I saw the "${job.title}" job in your gallery and I'd like a quote for something similar.`,
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ask about a job like this
                </a>
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}
