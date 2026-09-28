import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The brand lockups from public/brand, served from public/brand/web:
 *
 *  - dark  → the horizontal logo (brand 02) with its transparent border
 *            trimmed, for white and light surfaces.
 *  - light → the reversed stacked logo (brand 03) with its solid green
 *            background removed, so it sits on any dark surface.
 *
 * Originals stay untouched in public/brand/{png,svg}; the web/ copies are
 * derived from them and should be regenerated if the brand pack changes.
 */
const LOCKUPS = {
  dark: { src: "/brand/web/logo-horizontal.png", width: 600, height: 159, className: "h-10 w-auto md:h-11" },
  light: { src: "/brand/web/logo-reversed.svg", width: 303, height: 342, className: "h-32 w-auto" },
} as const;

export function Logo({
  className,
  tone = "dark",
  href = "/",
}: {
  className?: string;
  tone?: "dark" | "light";
  href?: string | null;
}) {
  const lockup = LOCKUPS[tone];
  const content = (
    <Image
      src={lockup.src}
      width={lockup.width}
      height={lockup.height}
      alt="So Fresh Cleaning Service"
      // The dark lockup is the header logo on every public page.
      priority={tone === "dark"}
      unoptimized={lockup.src.endsWith(".svg")}
      className={cn(lockup.className, className)}
    />
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex shrink-0 rounded-sm" aria-label="So Fresh Cleaning Service — home">
      {content}
    </Link>
  );
}
