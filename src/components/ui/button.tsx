import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-medium tracking-[0.01em] transition-[background-color,color,border-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        default:
          "sheen bg-gradient-to-b from-emerald to-forest text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_10px_24px_-12px_rgb(6_42_29/0.7)] hover:from-forest hover:to-forest-deep hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.14),0_16px_30px_-12px_rgb(6_42_29/0.75)]",
        accent:
          "sheen bg-gold text-[#241a06] shadow-[inset_0_1px_0_rgb(255_255_255/0.45),var(--shadow-gold)] hover:brightness-[1.05] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_16px_36px_-12px_rgb(154_123_60/0.7)]",
        whatsapp:
          "sheen bg-gradient-to-b from-[#25a35a] to-[#1a8346] text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.2),0_10px_24px_-12px_rgb(23_122_65/0.8)] hover:from-[#1f9450] hover:to-[#16733d]",
        outline: "border border-forest/25 bg-transparent text-forest hover:border-champagne hover:bg-ivory",
        subtle: "bg-mist text-forest hover:bg-[#e3eae5]",
        ghost: "text-forest hover:bg-mist",
        link: "rounded-none text-verdant underline underline-offset-4 hover:text-forest",
        destructive: "bg-destructive text-white hover:bg-[#8f1e17]",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        default: "h-11 px-6 text-[0.9375rem]",
        lg: "h-13 px-8 text-base",
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
