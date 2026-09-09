import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,color,border-color,box-shadow] duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        default: "bg-forest text-white hover:bg-forest-deep shadow-[0_1px_2px_rgb(13_59_42/0.18)]",
        accent: "bg-champagne text-[#241a06] hover:bg-[#b8985c]",
        whatsapp: "bg-[#1f8f4e] text-white hover:bg-[#177a41]",
        outline: "border border-forest/25 bg-transparent text-forest hover:bg-mist",
        subtle: "bg-mist text-forest hover:bg-[#e3eae5]",
        ghost: "text-forest hover:bg-mist",
        link: "text-verdant underline underline-offset-4 hover:text-forest",
        destructive: "bg-destructive text-white hover:bg-[#8f1e17]",
      },
      size: {
        sm: "h-9 px-3.5 text-sm",
        default: "h-11 px-5 text-[0.9375rem]",
        lg: "h-13 px-7 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
