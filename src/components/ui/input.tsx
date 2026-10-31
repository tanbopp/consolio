import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded border border-[#E3E7EA] bg-white px-3 py-1.5 text-sm text-[#182126] transition-colors placeholder:text-[#8D98A0] focus-visible:outline-none focus-visible:border-[#17685F] focus-visible:ring-1 focus-visible:ring-[#17685F] disabled:cursor-not-allowed disabled:bg-[#F6F7F8] disabled:text-[#8D98A0]",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
