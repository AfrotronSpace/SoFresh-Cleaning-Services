"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { ChevronsLeftRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Draggable seam. Keyboard-operable (arrow keys) and announced as a slider,
 * because a mouse-only comparison is useless to a lot of people.
 */
export function BeforeAfter({
  before,
  after,
  beforeAlt,
  afterAlt,
  className,
  aspectRatio,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  before: string;
  after: string;
  beforeAlt: string;
  afterAlt: string;
  className?: string;
  /** width / height — overrides the default 4:3 / 16:10 frame, e.g. for portrait phone photos. */
  aspectRatio?: number;
  sizes?: string;
}) {
  const [position, setPosition] = useState(52);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const touched = useRef(false);
  const labelId = useId();

  // The first time the frame scrolls into view the seam sweeps once, so it
  // is obvious the picture can be dragged. Any touch cancels it for good.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        io.disconnect();
        const stops = [52, 26, 70, 52];
        const leg = 900;
        const start = performance.now() + 500;
        const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
        const tick = (now: number) => {
          if (touched.current) return;
          const elapsed = now - start;
          if (elapsed >= 0) {
            const i = Math.min(stops.length - 2, Math.floor(elapsed / leg));
            const t = Math.min(1, (elapsed - i * leg) / leg);
            setPosition(stops[i] + (stops[i + 1] - stops[i]) * ease(t));
            if (elapsed >= leg * (stops.length - 1)) return;
          }
          frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      },
      { threshold: 0.55 },
    );
    io.observe(el);
    return () => {
      io.disconnect();
      cancelAnimationFrame(frame);
    };
  }, []);

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-2xl bg-mist shadow-[var(--shadow-panel)] ring-1 ring-champagne/40 md:aspect-[16/10]", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
      onPointerDown={(e) => {
        dragging.current = true;
        touched.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        updateFromClientX(e.clientX);
      }}
      onPointerMove={(e) => dragging.current && updateFromClientX(e.clientX)}
      onPointerUp={() => (dragging.current = false)}
      onPointerLeave={() => (dragging.current = false)}
    >
      <Image src={after} alt={afterAlt} fill sizes={sizes} className="object-cover" />

      {/* Same box as the after image, clipped — so both crop identically with no measuring. */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
        <Image src={before} alt={beforeAlt} fill sizes={sizes} className="object-cover" />
      </div>

      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-onyx/75 px-3.5 py-1.5 text-[0.6875rem] font-medium uppercase tracking-[0.16em] text-white backdrop-blur-md">
        Before
      </span>
      <span className="bg-gold pointer-events-none absolute right-4 top-4 rounded-full px-3.5 py-1.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#241a06]">
        After
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-px -translate-x-1/2 bg-gradient-to-b from-gold-light via-champagne to-gold-light shadow-[0_0_18px_rgb(240_223_174/0.7)]" style={{ left: `${position}%` }} />

      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% before, ${100 - Math.round(position)}% after`}
        onKeyDown={(e) => {
          touched.current = true;
          if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 4));
          if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 4));
          if (e.key === "Home") setPosition(0);
          if (e.key === "End") setPosition(100);
        }}
        className="absolute top-1/2 z-10 grid size-12 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-champagne bg-white/95 text-forest shadow-[0_8px_28px_-6px_rgb(3_23_15/0.6)] backdrop-blur-sm transition-transform duration-300 hover:scale-110"
        style={{ left: `${position}%` }}
      >
        <ChevronsLeftRight className="size-5" aria-hidden />
      </div>
      <span id={labelId} className="sr-only">
        Compare before and after
      </span>
    </div>
  );
}
