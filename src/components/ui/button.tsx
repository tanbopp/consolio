import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#17685F] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-[#17685F] text-white hover:bg-[#10534C] active:bg-[#0C413B]",
        cta:
          "bg-[#17685F] text-white hover:bg-[#10534C]",
        destructive:
          "bg-[#B42318] text-white hover:bg-[#911D13]",
        outline:
          "border border-[#E3E7EA] bg-white text-[#182126] hover:bg-[#F6F7F8] hover:border-[#D1D7DC]",
        secondary:
          "bg-[#F0F2F4] text-[#182126] hover:bg-[#E3E7EA]",
        ghost:
          "text-[#626E76] hover:bg-[#F0F2F4] hover:text-[#182126]",
        link: "text-[#17685F] underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        default: "h-9 px-3.5 py-1.5",
        sm: "h-8 px-2.5 text-xs",
        lg: "h-10 px-4 text-base",
        icon: "h-8 w-8 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
