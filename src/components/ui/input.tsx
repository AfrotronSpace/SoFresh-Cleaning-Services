import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-md border border-input bg-white px-3.5 py-2 text-[0.9375rem] text-ink shadow-[inset_0_1px_2px_rgb(13_59_42/0.04)] transition-colors",
        "placeholder:text-sage/70 focus-visible:border-verdant focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-verdant/25",
        "disabled:cursor-not-allowed disabled:bg-haze disabled:opacity-60",
        "aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20",
        "file:border-0 file:bg-transparent file:text-sm file:font-medium",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
export { Input };
