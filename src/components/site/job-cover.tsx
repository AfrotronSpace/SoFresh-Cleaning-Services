import Image from "next/image";
import { Play } from "lucide-react";
import type { PublicJob, PublicSlot } from "@/lib/gallery";
import { cn } from "@/lib/utils";

/** A still for any slot: the photo itself, or a video's poster frame. */
function Still({ slot, sizes, priority, className }: { slot: PublicSlot; sizes: string; priority?: boolean; className?: string }) {
  const src = slot.type === "PHOTO" ? slot.url : slot.poster;
  return (
    <div className={cn("relative h-full overflow-hidden bg-forest-deep", className)}>
      {src && <Image src={src} alt="" fill sizes={sizes} priority={priority} className="object-cover" />}
      {slot.type === "VIDEO" && (
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid size-11 place-items-center rounded-full bg-white/90 text-forest shadow-[var(--shadow-lift)]">
            <Play className="ml-0.5 size-4 fill-current" />
          </span>
        </span>
      )}
    </div>
  );
}

export function jobCounts(job: PublicJob) {
  let photos = 0;
  let videos = 0;
  for (const frame of job.frames) {
    for (const slot of [frame.primary, frame.secondary]) {
      if (!slot) continue;
      if (slot.type === "VIDEO") videos += 1;
      else photos += 1;
    }
  }
  return [photos && `${photos} photo${photos > 1 ? "s" : ""}`, videos && `${videos} video${videos > 1 ? "s" : ""}`]
    .filter(Boolean)
    .join(" · ");
}

export function jobMeta(job: PublicJob) {
  return [job.service && job.service.name !== job.title ? job.service.name : null, job.area, job.dateLabel]
    .filter(Boolean)
    .join(" · ");
}

/**
 * The card face used on /gallery and on service pages. Purely presentational —
 * the caller wraps it in a button or a link. Decorative images (alt="") because
 * the card's own title is the accessible name.
 */
export function JobCover({
  job,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw",
  priority,
}: {
  job: PublicJob;
  sizes?: string;
  /** Set on the first row so the page's largest paint isn't lazy-loaded. */
  priority?: boolean;
}) {
  const cover = job.frames[0];
  const meta = jobMeta(job);

  return (
    <>
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
        {cover.layout === "BEFORE_AFTER" && cover.secondary ? (
          <div className="grid h-full grid-cols-2">
            <Still slot={cover.primary} sizes={sizes} priority={priority} />
            <Still slot={cover.secondary} sizes={sizes} priority={priority} />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-champagne" />
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-forest-deep/80 px-2.5 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
              Before
            </span>
            <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-champagne px-2.5 py-0.5 text-xs font-medium text-[#241a06]">
              After
            </span>
          </div>
        ) : (
          <Still slot={cover.primary} sizes={sizes} priority={priority} />
        )}
        <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-forest">
          {jobCounts(job)}
        </span>
      </div>
      <div className="mt-3.5 px-0.5">
        <h3 className="font-sans text-[1.0625rem] font-semibold leading-snug text-ink transition-colors group-hover:text-forest">
          {job.title}
        </h3>
        {meta && <p className="mt-1 text-sm text-sage">{meta}</p>}
      </div>
    </>
  );
}
