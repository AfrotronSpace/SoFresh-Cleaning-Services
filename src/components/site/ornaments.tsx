import { cn } from "@/lib/utils";

/**
 * The four-point sparkle from the client's own logo, redrawn as an ornament.
 * It is the one decorative mark the site uses, so the luxury detailing stays
 * rooted in the brand rather than borrowed from a template.
 */
export function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-3 shrink-0 fill-current", className)}>
      <path d="M12 0C12.8 7 17 11.2 24 12C17 12.8 12.8 17 12 24C11.2 17 7 12.8 0 12C7 11.2 11.2 7 12 0Z" />
    </svg>
  );
}

/** Tracked small capitals above a section heading. */
export function Eyebrow({
  children,
  light = false,
  className,
}: {
  children: React.ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <p className={cn("eyebrow", light && "eyebrow-light", className)}>
      <Sparkle className="size-2.5" />
      {children}
    </p>
  );
}
