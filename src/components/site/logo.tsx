import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Wordmark with a champagne seam between "So" and "Fresh" — the same
 * before/after seam used across the site, shrunk to a single rule.
 */
export function Logo({
  className,
  tone = "dark",
  href = "/",
}: {
  className?: string;
  tone?: "dark" | "light";
  href?: string | null;
}) {
  const content = (
    <span className={cn("inline-flex items-baseline gap-2 font-display text-[1.375rem] font-semibold leading-none tracking-tight", className)}>
      <span className={tone === "light" ? "text-white" : "text-forest"}>So</span>
      <span aria-hidden className="h-5 w-px self-center bg-champagne" />
      <span className={tone === "light" ? "text-white" : "text-forest"}>Fresh</span>
      <span className={cn("text-[0.6875rem] font-medium tracking-[0.14em]", tone === "light" ? "text-champagne-soft/80" : "text-sage")}>
        cleaning
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="rounded-sm" aria-label="So Fresh Cleaning Service — home">
      {content}
    </Link>
  );
}
