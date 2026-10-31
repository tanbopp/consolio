"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Plus,
  ArrowRight,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
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
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
              Dashboard Penjual
            </h1>
            <p className="text-xs text-[#626E76] mt-0.5">
              Ringkasan operasional pengiriman, antrean pickup cluster, dan draft paket Anda.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/drafts/new">
              <Button size="sm" className="gap-1.5 h-8 text-xs font-semibold">
                <Plus className="h-3.5 w-3.5" />
                <span>Buat Draft Paket</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Warning Belum Terdaftar Cluster */}
        {!isLoading && !activeCluster && (
          <div className="rounded border border-[#F9E2B6] bg-[#FEF7E6] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-[#9A6700] shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-[#734C00]">
                  Belum Bergabung dengan Cluster Area
                </p>
                <p className="text-xs text-[#9A6700] mt-0.5">
                  Pilih atau buat cluster area fisik agar draft paket Anda dapat digabungkan dengan penjual sekitar.
                </p>
              </div>
            </div>
            <Link href="/onboarding">
              <Button size="sm" variant="outline" className="h-7 text-xs border-[#F9E2B6] bg-white text-[#734C00] hover:bg-[#FEF7E6]">
                Pilih Cluster
              </Button>
            </Link>
          </div>
        )}

        {isLoading ? (
          <div className="h-36 rounded border border-[#E3E7EA] bg-white animate-pulse" />
        ) : error ? (
          <div className="rounded border border-[#F8D2CF] bg-[#FDF2F1] p-4 text-center text-xs text-[#911D13]">
            Gagal memuat data dashboard. Silakan muat ulang halaman.
          </div>
        ) : (
          <>
            {/* Operational Summary Strip (Bukan deretan kartu dekoratif) */}
            <div className="rounded border border-[#E3E7EA] bg-white p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-[#E3E7EA]">
                <div className="py-2 sm:py-0 sm:px-3 first:pl-0">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Draft aktif
                  </span>
                  <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                    {stats?.activeDraftsCount || 0}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Dalam antrean
                  </span>
                </div>

                <div className="py-2 sm:py-0 sm:px-3">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Paket pickup berikut
                  </span>
                  <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                    {stats?.packagesInNextPickup || 0}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Siap dijemput
                  </span>
                </div>

                <div className="py-2 sm:py-0 sm:px-3">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Estimasi tagihan berikut
                  </span>
                  <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                    {formatRupiah(stats?.estimatedNextCost || 0)}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Termasuk fee platform
                  </span>
                </div>

                <div className="py-2 sm:py-0 sm:px-3">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Paket terkirim
                  </span>
                  <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                    {stats?.totalPackagesShipped || 0}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Total selesai
                  </span>
                </div>

                <div className="py-2 sm:py-0 sm:px-3">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Berat terkirim
                  </span>
                  <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                    {formatWeight(stats?.totalWeightShippedGram || 0)}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Total pengiriman
                  </span>
                </div>

                <div className="py-2 sm:py-0 sm:px-3 last:pr-0">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Estimasi penghematan
                  </span>
                  <p className="text-lg font-bold text-[#20734D] mt-0.5 tabular-nums">
                    {formatRupiah(
                      (stats?.totalSavingsRp || 0) +
                        (stats?.projectedSavingsNextPickupRp || 0)
                    )}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    vs kirim mandiri
                  </span>
                </div>
              </div>
            </div>

            {/* Antrean Pickup Berikutnya di Cluster Aktif */}
            <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
              <div className="p-4 border-b border-[#E3E7EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAFAFA]">
                <div>
                  <h2 className="text-sm font-semibold text-[#182126]">
                    Antrean pickup bersama di cluster {activeCluster ? `(${activeCluster.name})` : ""}
                  </h2>
                  <p className="text-xs text-[#626E76] mt-0.5">
                    Paket dengan kurir, tanggal, dan jendela waktu sama otomatis dikonsolidasikan.
                  </p>
                </div>
                <Link
                  href="/pickups/next"
                  className="text-xs font-medium text-[#17685F] hover:underline flex items-center gap-1"
                >
                  <span>Buka halaman pickup</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>

              {batches.length === 0 ? (
                <div className="p-8 text-center space-y-2">
                  <p className="text-xs text-[#8D98A0]">
                    Belum ada antrean grup pickup aktif di cluster Anda.
                  </p>
                  <Link href="/drafts/new">
                    <Button size="sm" variant="outline" className="h-7 text-xs">
                      Tambah Paket Pertama
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-[#E3E7EA]">
                  {batches.map((batch: {
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
                    basePickupFee: number;
                    platformFeePercent: number;
                    sellerProjections: Array<{
                      sellerId: string;
                      packageCount: number;
                      weightGram: number;
                      weightPercentage: number;
                      finalTotalCharge: number;
                    }>;
                  }) => (
                    <div key={batch.groupKey} className="p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-[#182126]">
                              {COURIER_LABELS[batch.courier] || batch.courier}
                            </span>
                            <span className="text-xs text-[#626E76]">
                              • {formatDateId(batch.pickupDate, true)} (
                              {PICKUP_WINDOW_LABELS[batch.pickupWindow]?.label})
                            </span>
                            <DraftStatusBadge
                              status={
                                batch.isReadyForPickup
                                  ? "READY_FOR_PICKUP"
                                  : "QUEUED"
                              }
                            />
                          </div>
                          <p className="text-xs text-[#626E76]">
                            Total {batch.totalPackages} paket • {formatWeight(batch.totalWeightGram)} dari {batch.sellerProjections.length} penjual
                          </p>
                        </div>

                        <div className="text-xs text-[#626E76]">
                          Biaya dasar {formatRupiah(batch.basePickupFee)} (+fee {batch.platformFeePercent}%)
                        </div>
                      </div>

                      {/* Progress Kuota */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="flex justify-between text-[#626E76] mb-1 text-[11px]">
                            <span>Jumlah paket: {batch.totalPackages}/{batch.minPackages}</span>
                            <span className="tabular-nums">{batch.packageProgressPct}%</span>
                          </div>
                          <Progress value={batch.packageProgressPct} />
                        </div>
                        <div>
                          <div className="flex justify-between text-[#626E76] mb-1 text-[11px]">
                            <span>Total berat: {formatWeight(batch.totalWeightGram)}/{formatWeight(batch.minTotalWeightGram)}</span>
                            <span className="tabular-nums">{batch.weightProgressPct}%</span>
                          </div>
                          <Progress value={batch.weightProgressPct} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Dua Bagian: Draft Terbaru & Riwayat Pickup */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Draft Paket Terbaru */}
              <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
                <div className="p-4 border-b border-[#E3E7EA] flex items-center justify-between bg-[#FAFAFA]">
                  <div>
                    <h2 className="text-sm font-semibold text-[#182126]">
                      Draft paket terbaru
                    </h2>
                    <p className="text-xs text-[#626E76]">
                      Paket yang baru saja Anda daftarkan
                    </p>
                  </div>
                  <Link
                    href="/drafts"
                    className="text-xs font-medium text-[#17685F] hover:underline"
                  >
                    Lihat semua →
                  </Link>
                </div>

                {recentDrafts.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[#8D98A0]">
                    Belum ada draft paket terdaftar.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E3E7EA]">
                    {recentDrafts.map((d: {
                      id: string;
                      recipientName: string;
                      city: string;
                      weightGram: number;
                      courier: string;
                      pickupDate: string;
                      pickupWindow: string;
                      status: string;
                    }) => (
                      <div key={d.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAFAFA]">
                        <div>
                          <p className="font-semibold text-[#182126]">
                            {d.recipientName}{" "}
                            <span className="font-normal text-[#626E76]">
                              ({d.city})
                            </span>
                          </p>
                          <p className="text-[11px] text-[#626E76] mt-0.5">
                            {COURIER_LABELS[d.courier] || d.courier} • {formatWeight(d.weightGram)} • {formatDateId(d.pickupDate)}
                          </p>
                        </div>
                        <DraftStatusBadge status={d.status} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Riwayat Pickup Selesai */}
              <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
                <div className="p-4 border-b border-[#E3E7EA] flex items-center justify-between bg-[#FAFAFA]">
                  <div>
                    <h2 className="text-sm font-semibold text-[#182126]">
                      Riwayat pickup selesai
                    </h2>
                    <p className="text-xs text-[#626E76]">
                      Rekap partisipasi dan pembagian biaya Anda
                    </p>
                  </div>
                  <Link
                    href="/history"
                    className="text-xs font-medium text-[#17685F] hover:underline"
                  >
                    Semua riwayat →
                  </Link>
                </div>

                {pickupHistory.length === 0 ? (
                  <p className="p-6 text-center text-xs text-[#8D98A0]">
                    Belum ada riwayat pickup yang selesai.
                  </p>
                ) : (
                  <div className="divide-y divide-[#E3E7EA]">
                    {pickupHistory.map((gp: {
                      id: string;
                      code: string;
                      courier: string;
                      pickupDate: string;
                      status: string;
                      myPackageCount: number;
                      myWeightGram: number;
                      myTotalAmount: number;
                    }) => (
                      <div key={gp.id} className="p-3.5 flex items-center justify-between gap-3 text-xs hover:bg-[#FAFAFA]">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/pickups/${gp.id}`}
                              className="font-medium text-[#17685F] hover:underline inline-flex items-center gap-1"
                            >
                              <span>{gp.code}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                            <GroupPickupStatusBadge status={gp.status} />
                          </div>
                          <p className="text-[11px] text-[#626E76] mt-0.5">
                            {COURIER_LABELS[gp.courier]} • {formatDateId(gp.pickupDate)} • {gp.myPackageCount} paket ({formatWeight(gp.myWeightGram)})
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-semibold text-[#182126] block tabular-nums">
                            {formatRupiah(gp.myTotalAmount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
