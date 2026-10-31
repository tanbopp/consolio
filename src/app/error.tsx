"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Consolio Application Error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md space-y-5 rounded-2xl border border-red-200 bg-white p-6 sm:p-8 shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-extrabold text-slate-900">
            Terjadi Kendala Teknis
          </h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            Maaf, terjadi gangguan saat memuat halaman ini. Silakan klik tombol
            Muat Ulang di bawah atau kembali ke Dashboard.
          </p>
          {error?.message && (
            <p className="rounded-lg bg-red-50 p-2 font-mono text-[11px] text-red-800">
              {error.message}
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button onClick={() => reset()} className="gap-2 w-full sm:w-auto">
            <RotateCcw className="h-4 w-4" />
            <span>Coba Muat Ulang</span>
          </Button>
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button variant="outline" className="gap-2 w-full">
              <Home className="h-4 w-4" />
              <span>Kembali ke Dashboard</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

