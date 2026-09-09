import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[7rem] w-full rounded-md border border-input bg-white px-3.5 py-2.5 text-[0.9375rem] leading-relaxed text-ink transition-colors",
        "placeholder:text-sage/70 focus-visible:border-verdant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant/25",
        "disabled:cursor-not-allowed disabled:bg-haze disabled:opacity-60",
        "aria-[invalid=true]:border-destructive",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
export { Textarea };
