import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format angka ke format Rupiah Indonesia tanpa spasi, contoh: Rp12.500
 */
export function formatRupiah(amount: number): string {
  const rounded = Math.round(amount || 0);
  const formatted = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(Math.abs(rounded));
  return rounded < 0 ? `-Rp${formatted}` : `Rp${formatted}`;
}

/**
 * Format berat dalam gram menjadi gram atau kilogram yang mudah dibaca,
 * contoh: 500 -> "500 g", 1250 -> "1,25 kg", 10000 -> "10 kg"
 */
export function formatWeight(gram: number): string {
  if (!gram || gram <= 0) return "0 g";
  if (gram < 1000) {
    return `${new Intl.NumberFormat("id-ID").format(gram)} g`;
  }
  const kg = gram / 1000;
  return `${new Intl.NumberFormat("id-ID", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(kg)} kg`;
}

/**
 * Format tanggal ke Bahasa Indonesia (contoh: 1 Nov 2026)
 */
export function formatDateId(dateInput: string | Date, includeDay = false): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    weekday: includeDay ? "long" : undefined,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Normalisasi tanggal ke YYYY-MM-DD (UTC midnight) untuk pengelompokan pickup yang deterministik
 */
export function toDateKey(dateInput: string | Date): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "2026-11-01";
  return d.toISOString().split("T")[0];
}

