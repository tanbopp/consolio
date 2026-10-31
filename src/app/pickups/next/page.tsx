"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  Calculator,
  CheckCircle2,
  PlusCircle,
  ExternalLink,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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

export default function NextPickupsPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string } | undefined)?.id;

  const { data, isLoading } = useQuery({
    queryKey: ["pickups", "next-view"],
    queryFn: async () => {
      const res = await fetch("/api/pickups");
      if (!res.ok) throw new Error("Gagal memuat data pickup berikutnya");
      return res.json();
    },
  });

  const batches = data?.consolidatedBatches || [];
  const scheduledPickups = (data?.pickups || []).filter(
    (p: { status: string }) =>
      p.status === "SCHEDULED" || p.status === "IN_PROGRESS"
  );

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Pickup Berikutnya & Simulasi Biaya
            </h1>
            <p className="text-sm text-slate-600">
              Pantau progress kuota menuju <strong>Siap Pickup</strong> dan
              lihat rincian pembagian biaya berdasarkan proporsi berat paket
              setiap penjual.
            </p>
          </div>
          <Link href="/drafts/new">
            <Button variant="cta" className="gap-1.5">
              <PlusCircle className="h-4 w-4" />
              <span>Tambah Paket ke Grup</span>
            </Button>
          </Link>
        </div>

        {/* Bagian 1: Jadwal Pickup Bersama yang Sudah Dibuat Admin (SCHEDULED / IN_PROGRESS) */}
        {scheduledPickups.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-base font-extrabold text-teal-950 flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              Jadwal Pickup Bersama Terkonfirmasi (Siap Dijemput Kurir)
            </h2>

            <div className="grid grid-cols-1 gap-4">
              {scheduledPickups.map(
                (gp: {
                  id: string;
                  code: string;
                  clusterName: string;
                  clusterCode: string;
                  courier: string;
                  pickupDate: string;
                  pickupWindow: string;
                  pickupTime: string;
                  totalPackages: number;
                  totalWeightGram: number;
                  totalCost: number;
                  status: string;
                }) => (
                  <Card
                    key={gp.id}
                    className="border-2 border-teal-600 bg-teal-50/30"
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-extrabold text-teal-900 bg-white px-2.5 py-0.5 rounded border border-teal-200">
                            {gp.code}
                          </span>
                          <GroupPickupStatusBadge status={gp.status} />
                          <Badge variant="teal">
                            {COURIER_LABELS[gp.courier]}
                          </Badge>
                        </div>
                        <p className="text-sm font-bold text-slate-900 pt-1">
                          {gp.clusterName} ({gp.clusterCode}) —{" "}
                          {formatDateId(gp.pickupDate, true)} Pukul{" "}
                          {gp.pickupTime} WIB
                        </p>
                        <p className="text-xs text-slate-600">
                          Total Terkonsolidasi:{" "}
                          <strong>{gp.totalPackages} paket</strong> (
                          <strong>{formatWeight(gp.totalWeightGram)}</strong>) •
                          Total Biaya + Fee:{" "}
                          <strong>{formatRupiah(gp.totalCost)}</strong>
                        </p>
                      </div>

                      <Link href={`/pickups/${gp.id}`}>
                        <Button className="gap-1.5">
                          <span>Lihat Rincian Pembagian Biaya</span>
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          </div>
        )}

        {/* Bagian 2: Grup Konsolidasi Draft (QUEUED & READY_FOR_PICKUP) */}
        <div className="space-y-4">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Truck className="h-5 w-5 text-teal-700" />
            Grup Penggabungan Draft Aktif Berdasarkan Cluster, Tanggal, Waktu &
            Kurir
          </h2>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2].map((n) => (
                <div
                  key={n}
                  className="h-48 rounded-xl bg-slate-200/70 animate-pulse"
                />
              ))}
            </div>
          ) : batches.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center space-y-3">
                <p className="text-base font-bold text-slate-800">
                  Belum Ada Grup Penggabungan Aktif
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Buat draft paket baru untuk memulai grup penggabungan pickup
                  di cluster Anda.
                </p>
                <Link href="/drafts/new" className="inline-block pt-2">
                  <Button variant="cta" size="sm">
                    Buat Draft Pengiriman
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {batches.map(
                (batch: {
                  groupKey: string;
                  clusterId: string;
                  clusterName: string;
                  clusterCode: string;
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
                    sellerName: string;
                    storeName: string;
                    packageCount: number;
                    weightGram: number;
                    weightPercentage: number;
                    costBeforeFee: number;
                    platformFee: number;
                    finalTotalCharge: number;
                    estimatedSavings: number;
                  }>;
                }) => (
                  <Card
                    key={batch.groupKey}
                    className={
                      batch.isReadyForPickup
                        ? "border-2 border-amber-400 shadow-md"
                        : ""
                    }
                  >
                    <CardHeader className="bg-slate-50/70 border-b border-slate-100">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded bg-teal-900 px-2 py-0.5 font-mono text-xs font-bold text-white">
                              {batch.clusterCode}
                            </span>
                            <span className="font-bold text-slate-900 text-sm">
                              {batch.clusterName}
                            </span>
                            <Badge variant="teal">
                              {COURIER_LABELS[batch.courier]}
                            </Badge>
                            <Badge variant="outline">
                              {formatDateId(batch.pickupDate, true)} •{" "}
                              {PICKUP_WINDOW_LABELS[batch.pickupWindow]?.label}{" "}
                              (
                              {
                                PICKUP_WINDOW_LABELS[batch.pickupWindow]
                                  ?.timeRange
                              }
                              )
                            </Badge>
                          </div>
                          <CardTitle className="text-base pt-1">
                            {batch.isReadyForPickup
                              ? "🎉 Syarat Minimum Tercapai! Grup Ini Berstatus SIAP PICKUP"
                              : "Sedang Mengumpulkan Kuota Paket / Berat Minimum"}
                          </CardTitle>
                        </div>

                        <DraftStatusBadge
                          status={
                            batch.isReadyForPickup
                              ? "READY_FOR_PICKUP"
                              : "QUEUED"
                          }
                        />
                      </div>
                    </CardHeader>

                    <CardContent className="pt-5 space-y-5">
                      {/* Dual Progress Bar */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 border border-slate-200/80">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-800">
                            <span>Progress Jumlah Paket:</span>
                            <span className="text-teal-800">
                              {batch.totalPackages} dari {batch.minPackages}{" "}
                              paket ({batch.packageProgressPct}%)
                            </span>
                          </div>
                          <Progress value={batch.packageProgressPct} />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold text-slate-800">
                            <span>Progress Total Berat:</span>
                            <span className="text-teal-800">
                              {formatWeight(batch.totalWeightGram)} dari{" "}
                              {formatWeight(batch.minTotalWeightGram)} (
                              {batch.weightProgressPct}%)
                            </span>
                          </div>
                          <Progress value={batch.weightProgressPct} />
                        </div>
                      </div>

                      {/* Tabel Rincian Simulasi Pembagian Biaya per Penjual */}
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Calculator className="h-4 w-4 text-teal-700" />
                            Rincian Pembagian Biaya Transparan (Biaya Dasar:{" "}
                            {formatRupiah(batch.basePickupFee)} + Fee Platform{" "}
                            {batch.platformFeePercent}%)
                          </h4>
                          <span className="text-xs text-slate-500 flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {batch.sellerProjections.length} Penjual Tergabung
                          </span>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                              <tr>
                                <th className="py-2.5 px-3">
                                  Penjual / Nama Toko
                                </th>
                                <th className="py-2.5 px-3 text-center">
                                  Paket
                                </th>
                                <th className="py-2.5 px-3 text-right">
                                  Berat Penjual
                                </th>
                                <th className="py-2.5 px-3 text-right">
                                  % Berat
                                </th>
                                <th className="py-2.5 px-3 text-right">
                                  Biaya Sebelum Fee
                                </th>
                                <th className="py-2.5 px-3 text-right">
                                  Fee ({batch.platformFeePercent}%)
                                </th>
                                <th className="py-2.5 px-3 text-right">
                                  Total Tagihan
                                </th>
                                <th className="py-2.5 px-3 text-right">
                                  Hemat vs Sendiri
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {batch.sellerProjections.map((proj) => {
                                const isMe = proj.sellerId === currentUserId;
                                return (
                                  <tr
                                    key={proj.sellerId}
                                    className={
                                      isMe
                                        ? "bg-teal-50/90 font-semibold"
                                        : "hover:bg-slate-50"
                                    }
                                  >
                                    <td className="py-2.5 px-3">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-bold text-slate-900">
                                          {proj.sellerName}
                                        </span>
                                        {isMe && (
                                          <Badge className="bg-teal-700 text-white border-none text-[10px]">
                                            Anda
                                          </Badge>
                                        )}
                                      </div>
                                      <span className="text-[11px] text-slate-500 block">
                                        {proj.storeName}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 text-center">
                                      {proj.packageCount} pkt
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-medium">
                                      {formatWeight(proj.weightGram)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      {proj.weightPercentage}%
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      {formatRupiah(proj.costBeforeFee)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right">
                                      {formatRupiah(proj.platformFee)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-extrabold text-teal-900">
                                      {formatRupiah(proj.finalTotalCharge)}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                                      {formatRupiah(proj.estimatedSavings)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

