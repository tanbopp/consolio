import React from "react";
import Link from "next/link";
import { Package, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="mx-auto max-w-md space-y-5">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-md">
          <Package className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-extrabold uppercase tracking-widest text-orange-600">
            Error 404 — Halaman Tidak Ditemukan
          </p>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Ups! Alamat Tujuan Tidak Ditemukan
          </h1>
          <p className="text-sm text-slate-600">
            Halaman atau kode pickup yang Anda cari tidak tersedia atau sudah
            dipindahkan.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link href="/dashboard">
            <Button className="gap-2">
              <Home className="h-4 w-4" />
              <span>Ke Dashboard Utama</span>
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              <span>Halaman Depan Consolio</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

