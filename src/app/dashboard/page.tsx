"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Package,
  Truck,
  Wallet,
  TrendingDown,
  Scale,
  PlusCircle,
  ArrowRight,
  MapPin,
  CheckCircle2,
  Clock,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Badge,
  DraftStatusBadge,
  GroupPickupStatusBadge,
} from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { COURIER_LABELS, PICKUP_WINDOW_LABELS } from "@/lib/constants";
import { formatRupiah, formatWeight, formatDateId } from "@/lib/utils";

export default function SellerDashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Gagal memuat data dashboard");
      return res.json();
    },
  });

  const stats = data?.sellerStats;
  const activeCluster = stats?.activeCluster;
  const batches = stats?.batchesInMyCluster || [];
  const recentDrafts = stats?.recentDrafts || [];
  const pickupHistory = stats?.myPickupHistory || [];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Dashboard Penjual UMKM
            </h1>
            <p className="text-sm text-slate-600 mt-0.5">
              Pantau progress kuota pickup cluster, estimasi tagihan proporsional,
              dan total penghematan ongkir Anda.
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <Link href="/pickups/next">
              <Button variant="outline" className="gap-1.5">
                <Truck className="h-4 w-4 text-teal-700" />
                <span>Pickup Berikutnya</span>
              </Button>
            </Link>
            <Link href="/drafts/new">
              <Button variant="cta" className="gap-1.5">
                <PlusCircle className="h-4 w-4" />
                <span>Buat Draft Paket</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Banner jika belum gabung cluster */}
        {!isLoading && !activeCluster && (
          <div className="rounded-xl border border-orange-300 bg-orange-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-orange-950">
                  Anda Belum Aktif di Cluster Area Mana Pun
                </h3>
                <p className="text-xs text-orange-800 mt-0.5">
                  Sesuai aturan bisnis Consolio, Anda wajib bergabung ke satu
                  cluster area fisik terlebih dahulu sebelum dapat membuat draft
                  pengiriman.
                </p>
              </div>
            </div>
            <Link href="/onboarding">
              <Button variant="cta" size="sm" className="shrink-0">
                Pilih / Gabung Cluster Sekarang
              </Button>
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-28 rounded-xl bg-slate-200/70 animate-pulse"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            Gagal memuat statistik dashboard. Silakan muat ulang halaman.
          </div>
        ) : (
          <>
            {/* 6 Kartu Statistik Utama (Sesuai Spesifikasi 4.7) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-teal-700">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Jumlah Draft Aktif
                    </span>
                    <Package className="h-5 w-5 text-teal-700" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {stats?.activeDraftsCount || 0} Paket
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Berstatus Draft, Antre Gabung, atau Siap Pickup
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Paket dalam Pickup Berikutnya
                    </span>
                    <Truck className="h-5 w-5 text-orange-600" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {stats?.packagesInNextPickup || 0} Paket
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Tergabung di jadwal pickup cluster aktif
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-amber-500">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Estimasi Biaya Harus Dibayar
                    </span>
                    <Wallet className="h-5 w-5 text-amber-600" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-teal-900">
                    {formatRupiah(stats?.estimatedNextCost || 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Sudah termasuk proporsi berat + fee platform
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Total Paket Terkirim
                    </span>
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {stats?.totalPackagesShipped || 0} Paket
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Telah dijemput kurir / sampai ke pembeli
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Total Berat Terkirim
                    </span>
                    <Scale className="h-5 w-5 text-indigo-600" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {formatWeight(stats?.totalWeightShippedGram || 0)}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Akumulasi berat seluruh pengiriman selesai
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-teal-900 to-teal-800 text-white border-none">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-200">
                      Estimasi Total Penghematan
                    </span>
                    <TrendingDown className="h-5 w-5 text-orange-400" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-white">
                    {formatRupiah(
                      (stats?.totalSavingsRp || 0) +
                        (stats?.projectedSavingsNextPickupRp || 0)
                    )}
                  </p>
                  <p className="mt-1 text-[11px] text-teal-100">
                    Realisasi: {formatRupiah(stats?.totalSavingsRp || 0)} +
                    Pickup berikutnya:{" "}
                    {formatRupiah(stats?.projectedSavingsNextPickupRp || 0)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Progress Penggabungan Pickup di Cluster */}
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-teal-700" />
                    Progress Penggabungan Pickup di Cluster{" "}
                    {activeCluster ? `(${activeCluster.name})` : ""}
                  </CardTitle>
                  <CardDescription>
                    Paket dengan tanggal, jendela waktu, dan kurir yang sama
                    otomatis digabung menuju kuota minimum.
                  </CardDescription>
                </div>
                <Link href="/pickups/next">
                  <Button variant="secondary" size="sm" className="gap-1">
                    <span>Detail Simulasi Biaya</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {batches.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <p className="text-sm font-bold text-slate-700">
                      Belum Ada Antrean Penggabungan Aktif
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Tambahkan draft paket baru untuk memulai grup penggabungan
                      pickup bersama tetangga di cluster Anda.
                    </p>
                    <Link href="/drafts/new" className="inline-block mt-4">
                      <Button variant="cta" size="sm">
                        Buat Draft Pengiriman Pertama
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {batches.map(
                      (b: {
                        groupKey: string;
                        pickupDate: string;
                        pickupWindow: string;
                        courier: string;
                        totalPackages: number;
                        minPackages: number;
                        packageProgressPct: number;
                        totalWeightGram: number;
                        minTotalWeightGram: number;
                        weightProgressPct: number;
                        isReadyForPickup: boolean;
                        sellerProjections: Array<{
                          sellerId: string;
                          packageCount: number;
                          weightGram: number;
                          weightPercentage: number;
                          finalTotalCharge: number;
                          estimatedSavings: number;
                        }>;
                      }) => {
                        const myProj = b.sellerProjections.find(
                          (p) => p.sellerId !== undefined
                        );
                        return (
                          <div
                            key={b.groupKey}
                            className={`rounded-xl border p-4 space-y-3 ${
                              b.isReadyForPickup
                                ? "border-amber-300 bg-amber-50/40"
                                : "border-slate-200 bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <Badge variant="teal">
                                    {COURIER_LABELS[b.courier] || b.courier}
                                  </Badge>
                                  <span className="text-xs font-bold text-slate-800">
                                    {formatDateId(b.pickupDate)} •{" "}
                                    {PICKUP_WINDOW_LABELS[b.pickupWindow]
                                      ?.label || b.pickupWindow}
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-500 mt-0.5">
                                  Jam Operasional:{" "}
                                  {
                                    PICKUP_WINDOW_LABELS[b.pickupWindow]
                                      ?.timeRange
                                  }
                                </p>
                              </div>
                              <DraftStatusBadge
                                status={
                                  b.isReadyForPickup
                                    ? "READY_FOR_PICKUP"
                                    : "QUEUED"
                                }
                              />
                            </div>

                            {/* Progress Bar Paket & Berat sesuai Spesifikasi 4.4 */}
                            <div className="space-y-2 text-xs">
                              <div>
                                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                  <span>Progress Jumlah Paket:</span>
                                  <span>
                                    {b.totalPackages} dari {b.minPackages} paket
                                  </span>
                                </div>
                                <Progress value={b.packageProgressPct} />
                              </div>

                              <div>
                                <div className="flex justify-between font-semibold text-slate-700 mb-1">
                                  <span>Progress Total Berat:</span>
                                  <span>
                                    {formatWeight(b.totalWeightGram)} dari{" "}
                                    {formatWeight(b.minTotalWeightGram)}
                                  </span>
                                </div>
                                <Progress value={b.weightProgressPct} />
                              </div>
                            </div>

                            {myProj && (
                              <div className="rounded-lg bg-teal-50/90 border border-teal-200 p-2.5 text-xs flex items-center justify-between">
                                <span className="text-teal-900">
                                  Porsi Grup Ini ({b.sellerProjections.length}{" "}
                                  Penjual):
                                </span>
                                <span className="font-bold text-teal-900">
                                  Mulai{" "}
                                  {formatRupiah(
                                    Math.min(
                                      ...b.sellerProjections.map(
                                        (s) => s.finalTotalCharge
                                      )
                                    )
                                  )}{" "}
                                  / penjual
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Dua Kolom Bawah: Draft Terbaru & Riwayat Pickup Selesai */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Draft Paket Terbaru Saya */}
              <div className="lg:col-span-6">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Draft & Status Paket Terbaru
                      </CardTitle>
                      <CardDescription>
                        6 paket terakhir yang Anda tambahkan
                      </CardDescription>
                    </div>
                    <Link href="/drafts">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Lihat Semua →
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {recentDrafts.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Belum ada draft paket.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {recentDrafts.map(
                          (d: {
                            id: string;
                            recipientName: string;
                            city: string;
                            weightGram: number;
                            courier: string;
                            pickupDate: string;
                            pickupWindow: string;
                            status: string;
                          }) => (
                            <div
                              key={d.id}
                              className="py-3 flex items-center justify-between gap-3 text-xs"
                            >
                              <div>
                                <p className="font-bold text-slate-900">
                                  {d.recipientName}{" "}
                                  <span className="font-normal text-slate-500">
                                    ({d.city})
                                  </span>
                                </p>
                                <p className="text-slate-500 mt-0.5">
                                  {COURIER_LABELS[d.courier] || d.courier} •{" "}
                                  {formatWeight(d.weightGram)} •{" "}
                                  {formatDateId(d.pickupDate)} (
                                  {PICKUP_WINDOW_LABELS[d.pickupWindow]?.label})
                                </p>
                              </div>
                              <DraftStatusBadge status={d.status} />
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Riwayat Pickup Bersama yang Diikuti */}
              <div className="lg:col-span-6">
                <Card className="h-full">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        Riwayat Pickup & Tagihan Saya
                      </CardTitle>
                      <CardDescription>
                        Rekap pembagian biaya pickup bersama
                      </CardDescription>
                    </div>
                    <Link href="/history">
                      <Button variant="ghost" size="sm" className="text-xs">
                        Laporan & CSV →
                      </Button>
                    </Link>
                  </CardHeader>
                  <CardContent>
                    {pickupHistory.length === 0 ? (
                      <p className="text-xs text-slate-500 text-center py-6">
                        Anda belum memiliki riwayat pickup bersama yang selesai.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {pickupHistory.map(
                          (gp: {
                            id: string;
                            code: string;
                            courier: string;
                            pickupDate: string;
                            status: string;
                            myPackageCount: number;
                            myWeightGram: number;
                            myWeightPercent: number;
                            myTotalAmount: number;
                            mySavings: number;
                          }) => (
                            <div
                              key={gp.id}
                              className="rounded-xl border border-slate-200 p-3.5 text-xs hover:border-teal-300 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <Link
                                  href={`/pickups/${gp.id}`}
                                  className="font-mono font-bold text-teal-800 hover:underline flex items-center gap-1"
                                >
                                  <span>{gp.code}</span>
                                  <ExternalLink className="h-3 w-3" />
                                </Link>
                                <GroupPickupStatusBadge status={gp.status} />
                              </div>
                              <div className="mt-2 flex items-center justify-between text-slate-600">
                                <span>
                                  {COURIER_LABELS[gp.courier]} •{" "}
                                  {formatDateId(gp.pickupDate)} •{" "}
                                  {gp.myPackageCount} pkt (
                                  {formatWeight(gp.myWeightGram)} /{" "}
                                  {gp.myWeightPercent}%)
                                </span>
                                <div className="text-right">
                                  <span className="font-extrabold text-slate-900 block">
                                    {formatRupiah(gp.myTotalAmount)}
                                  </span>
                                  <span className="text-[10px] font-semibold text-emerald-700">
                                    Hemat {formatRupiah(gp.mySavings)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

