"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const WORDS = ["", "Poor", "Below expectations", "Good", "Very good", "Excellent"];

/** Five radio buttons dressed as stars, so keyboard arrows and screen readers work without extra code. */
export function StarInput({
  name,
  value,
  onChange,
  invalid,
  idPrefix = name,
}: {
  name: string;
  value: number;
  onChange: (value: number) => void;
  invalid?: boolean;
  idPrefix?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div role="radiogroup" aria-invalid={invalid || undefined} className="flex" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} htmlFor={`${idPrefix}-${n}`} className="cursor-pointer p-1" onMouseEnter={() => setHover(n)}>
            <input
              id={`${idPrefix}-${n}`}
              type="radio"
              name={name}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="peer sr-only"
            />
            <Star
              aria-hidden
              className={cn(
                "size-7 rounded-sm transition-colors peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-ring",
                n <= shown ? "fill-champagne text-champagne" : "fill-transparent text-sage/40",
              )}
            />
            <span className="sr-only">
              {n} star{n > 1 ? "s" : ""} — {WORDS[n]}
            </span>
          </label>
        ))}
      </div>
      <span aria-hidden className="text-sm text-sage">
        {shown ? WORDS[shown] : "Tap a star"}
      </span>
    </div>
  );
}
