import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  indicatorClassName?: string;
}

export function Progress({
  value,
  className,
  indicatorClassName,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value || 0));
  return (
    <div
      className={cn(
        "relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/80",
        className
      )}
      {...props}
    >
      <div
        className={cn(
          "h-full transition-all duration-500 ease-out rounded-full",
          clamped >= 100 ? "bg-emerald-600" : "bg-teal-700",
          indicatorClassName
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

