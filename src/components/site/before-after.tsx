"use client";

import Image from "next/image";
import { useCallback, useId, useRef, useState } from "react";
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
  const labelId = useId();

  const updateFromClientX = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, next)));
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn("relative aspect-[4/3] w-full touch-pan-y select-none overflow-hidden rounded-2xl bg-mist md:aspect-[16/10]", className)}
      style={aspectRatio ? { aspectRatio } : undefined}
      onPointerDown={(e) => {
        dragging.current = true;
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

      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-forest-deep/80 px-3 py-1 text-xs font-medium text-white backdrop-blur-sm">
        Before
      </span>
      <span className="pointer-events-none absolute right-4 top-4 rounded-full bg-champagne px-3 py-1 text-xs font-medium text-[#241a06]">
        After
      </span>

      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-champagne" style={{ left: `${position}%` }} />

      <div
        role="slider"
        tabIndex={0}
        aria-labelledby={labelId}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(position)}
        aria-valuetext={`${Math.round(position)}% before, ${100 - Math.round(position)}% after`}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") setPosition((p) => Math.max(0, p - 4));
          if (e.key === "ArrowRight") setPosition((p) => Math.min(100, p + 4));
          if (e.key === "Home") setPosition(0);
          if (e.key === "End") setPosition(100);
        }}
        className="absolute top-1/2 z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border-2 border-champagne bg-white shadow-[var(--shadow-lift)]"
        style={{ left: `${position}%` }}
      >
        <span className="text-[0.65rem] font-semibold tracking-tight text-forest">drag</span>
      </div>
      <span id={labelId} className="sr-only">
        Compare before and after
      </span>
    </div>
  );
}
