import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DRAFT_STATUS_CONFIG,
  GROUP_PICKUP_STATUS_CONFIG,
} from "@/lib/constants";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "teal" | "orange";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variant === "default" && "border-slate-200 bg-slate-100 text-slate-800",
        variant === "outline" && "border-slate-300 bg-white text-slate-700",
        variant === "teal" && "border-teal-200 bg-teal-50 text-teal-800",
        variant === "orange" && "border-orange-200 bg-orange-50 text-orange-800",
        className
      )}
      {...props}
    />
  );
}

/**
 * Badge warna sesuai spesifikasi Bagian 8 UI/UX:
 * - DRAFT: abu-abu
 * - QUEUED: biru
 * - READY_FOR_PICKUP: kuning
 * - PICKED_UP: ungu
 * - SHIPPED: biru tua
 * - DELIVERED: hijau
 * - CANCELLED: merah
 */
export function DraftStatusBadge({ status }: { status: string }) {
  const cfg = DRAFT_STATUS_CONFIG[status] || {
    label: status,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        cfg.badgeClass
      )}
    >
      {cfg.label}
    </span>
  );
}

export function GroupPickupStatusBadge({ status }: { status: string }) {
  const cfg = GROUP_PICKUP_STATUS_CONFIG[status] || {
    label: status,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-300",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        cfg.badgeClass
      )}
    >
      {cfg.label}
    </span>
  );
}

