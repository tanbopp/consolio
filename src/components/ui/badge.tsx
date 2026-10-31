import * as React from "react";
import { cn } from "@/lib/utils";
import {
  DRAFT_STATUS_CONFIG,
  GROUP_PICKUP_STATUS_CONFIG,
} from "@/lib/constants";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "outline" | "teal" | "orange" | "neutral" | "success" | "warning" | "danger";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium border",
        variant === "default" && "border-[#E3E7EA] bg-[#F0F2F4] text-[#182126]",
        variant === "neutral" && "border-[#E3E7EA] bg-[#F6F7F8] text-[#626E76]",
        variant === "outline" && "border-[#E3E7EA] bg-white text-[#182126]",
        variant === "teal" && "border-[#C6E2DF] bg-[#EDF5F4] text-[#10534C]",
        variant === "orange" && "border-[#F9E2B6] bg-[#FEF7E6] text-[#734C00]",
        variant === "success" && "border-[#C3E6D3] bg-[#EAF5EF] text-[#144D33]",
        variant === "warning" && "border-[#F9E2B6] bg-[#FEF7E6] text-[#734C00]",
        variant === "danger" && "border-[#F8D2CF] bg-[#FDF2F1] text-[#911D13]",
        className
      )}
      {...props}
    />
  );
}

const DRAFT_STATUS_SUBDUED: Record<string, { label: string; dotColor: string; bg: string; text: string; border: string }> = {
  DRAFT: {
    label: "Draft",
    dotColor: "bg-[#8D98A0]",
    bg: "bg-[#F6F7F8]",
    text: "text-[#626E76]",
    border: "border-[#E3E7EA]",
  },
  QUEUED: {
    label: "Antre gabung",
    dotColor: "bg-[#2563EB]",
    bg: "bg-[#EFF6FF]",
    text: "text-[#1E40AF]",
    border: "border-[#DBEAFE]",
  },
  READY_FOR_PICKUP: {
    label: "Siap pickup",
    dotColor: "bg-[#D97706]",
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    border: "border-[#FDE68A]",
  },
  PICKED_UP: {
    label: "Sudah dipickup",
    dotColor: "bg-[#7C3AED]",
    bg: "bg-[#F5F3FF]",
    text: "text-[#5B21B6]",
    border: "border-[#DDD6FE]",
  },
  SHIPPED: {
    label: "Dalam pengiriman",
    dotColor: "bg-[#0284C7]",
    bg: "bg-[#F0F9FF]",
    text: "text-[#0369A1]",
    border: "border-[#BAE6FD]",
  },
  DELIVERED: {
    label: "Terkirim",
    dotColor: "bg-[#20734D]",
    bg: "bg-[#EAF5EF]",
    text: "text-[#144D33]",
    border: "border-[#C3E6D3]",
  },
  CANCELLED: {
    label: "Dibatalkan",
    dotColor: "bg-[#B42318]",
    bg: "bg-[#FDF2F1]",
    text: "text-[#911D13]",
    border: "border-[#F8D2CF]",
  },
};

export function DraftStatusBadge({ status }: { status: string }) {
  const cfg = DRAFT_STATUS_SUBDUED[status] || {
    label: DRAFT_STATUS_CONFIG[status]?.label || status,
    dotColor: "bg-[#8D98A0]",
    bg: "bg-[#F6F7F8]",
    text: "text-[#626E76]",
    border: "border-[#E3E7EA]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium border",
        cfg.bg,
        cfg.text,
        cfg.border
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotColor)} />
      <span>{cfg.label}</span>
    </span>
  );
}

const GROUP_PICKUP_SUBDUED: Record<string, { label: string; dotColor: string; bg: string; text: string; border: string }> = {
  SCHEDULED: {
    label: "Terjadwal",
    dotColor: "bg-[#2563EB]",
    bg: "bg-[#EFF6FF]",
    text: "text-[#1E40AF]",
    border: "border-[#DBEAFE]",
  },
  IN_PROGRESS: {
    label: "Sedang dijemput",
    dotColor: "bg-[#D97706]",
    bg: "bg-[#FEF3C7]",
    text: "text-[#92400E]",
    border: "border-[#FDE68A]",
  },
  COMPLETED: {
    label: "Selesai",
    dotColor: "bg-[#20734D]",
    bg: "bg-[#EAF5EF]",
    text: "text-[#144D33]",
    border: "border-[#C3E6D3]",
  },
  CANCELLED: {
    label: "Dibatalkan",
    dotColor: "bg-[#B42318]",
    bg: "bg-[#FDF2F1]",
    text: "text-[#911D13]",
    border: "border-[#F8D2CF]",
  },
};

export function GroupPickupStatusBadge({ status }: { status: string }) {
  const cfg = GROUP_PICKUP_SUBDUED[status] || {
    label: GROUP_PICKUP_STATUS_CONFIG[status]?.label || status,
    dotColor: "bg-[#8D98A0]",
    bg: "bg-[#F6F7F8]",
    text: "text-[#626E76]",
    border: "border-[#E3E7EA]",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-xs font-medium border",
        cfg.bg,
        cfg.text,
        cfg.border
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", cfg.dotColor)} />
      <span>{cfg.label}</span>
    </span>
  );
}
