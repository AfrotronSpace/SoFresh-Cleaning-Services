import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium leading-none",
  {
    variants: {
      variant: {
        default: "bg-mist text-forest",
        accent: "bg-champagne-soft text-[#5c4715]",
        outline: "border border-forest/20 text-forest",
        solid: "bg-forest text-white",
        good: "bg-[#e2f2e9] text-[#14603f]",
        warn: "bg-[#fbf0d8] text-[#7a5a13]",
        bad: "bg-[#fbe6e4] text-[#8f1e17]",
        neutral: "bg-mist text-sage",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
export { Badge, badgeVariants };
