"use client";

import React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import {
  Truck,
  Plus,
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
              Pickup Berikutnya & Simulasi Biaya
            </h1>
            <p className="text-xs text-[#626E76] mt-0.5">
              Antrean kuota konsolidasi dan simulasi pembagian biaya pickup cluster per penjual.
            </p>
          </div>
          <Link href="/drafts/new">
            <Button size="sm" className="gap-1.5 h-8 text-xs font-semibold">
              <Plus className="h-3.5 w-3.5" />
              <span>Tambah Paket</span>
            </Button>
          </Link>
        </div>

        {/* 1. Jadwal Terkonfirmasi */}
        {scheduledPickups.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#182126] uppercase tracking-wider">
              Jadwal Pickup Bersama Terkonfirmasi
            </h2>

            <div className="rounded border border-[#E3E7EA] bg-white divide-y divide-[#E3E7EA]">
              {scheduledPickups.map((gp: {
                id: string;
                code: string;
                clusterName: string;
                clusterCode: string;
                courier: string;
                pickupDate: string;
                pickupTime: string;
                totalPackages: number;
                totalWeightGram: number;
                totalCost: number;
                status: string;
              }) => (
                <div key={gp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAFAFA]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#182126]">
                        {gp.code}
                      </span>
                      <GroupPickupStatusBadge status={gp.status} />
                      <span className="text-xs text-[#626E76]">
                        {COURIER_LABELS[gp.courier] || gp.courier}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#182126]">
                      {gp.clusterName} ({gp.clusterCode}) — {formatDateId(gp.pickupDate, true)} Pukul {gp.pickupTime} WIB
                    </p>
                    <p className="text-xs text-[#626E76]">
                      {gp.totalPackages} paket • {formatWeight(gp.totalWeightGram)} • Tagihan total: {formatRupiah(gp.totalCost)}
                    </p>
                  </div>

                  <Link href={`/pickups/${gp.id}`}>
                    <Button variant="outline" size="sm" className="h-8 text-xs gap-1">
                      <span>Rincian biaya</span>
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Antrean Grup Draft Aktif */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#182126] uppercase tracking-wider">
            Antrean Konsolidasi Grup Paket
          </h2>

          {isLoading ? (
            <div className="h-48 rounded border border-[#E3E7EA] bg-white animate-pulse" />
          ) : batches.length === 0 ? (
            <div className="rounded border border-[#E3E7EA] bg-white p-8 text-center space-y-2">
              <Truck className="h-6 w-6 text-[#8D98A0] mx-auto" />
              <p className="text-xs font-semibold text-[#182126]">
                Tidak ada antrean pickup aktif
              </p>
              <p className="text-xs text-[#626E76]">
                Tambahkan paket baru untuk memulai grup penjemputan bersama.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {batches.map((batch: {
                groupKey: string;
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
                }>;
              }) => (
                <div key={batch.groupKey} className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
                  <div className="p-4 border-b border-[#E3E7EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAFAFA]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#182126]">
                          {batch.clusterName} ({batch.clusterCode})
                        </span>
                        <span className="text-xs text-[#626E76]">
                          • {COURIER_LABELS[batch.courier] || batch.courier} • {formatDateId(batch.pickupDate)} (
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
                        Biaya dasar {formatRupiah(batch.basePickupFee)} (+fee {batch.platformFeePercent}%) • {batch.totalPackages} paket terkumpul ({formatWeight(batch.totalWeightGram)})
                      </p>
                    </div>

                    <div className="text-xs text-[#626E76]">
                      {batch.isReadyForPickup ? "Syarat minimum tercapai" : "Menuju syarat minimum"}
                    </div>
                  </div>

                  {/* Dual Progress Bars */}
                  <div className="p-4 border-b border-[#E3E7EA] bg-white grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="flex justify-between text-[#626E76] mb-1 text-[11px]">
                        <span>Jumlah paket: {batch.totalPackages} dari {batch.minPackages}</span>
                        <span className="tabular-nums font-medium">{batch.packageProgressPct}%</span>
                      </div>
                      <Progress value={batch.packageProgressPct} />
                    </div>
                    <div>
                      <div className="flex justify-between text-[#626E76] mb-1 text-[11px]">
                        <span>Total berat: {formatWeight(batch.totalWeightGram)} dari {formatWeight(batch.minTotalWeightGram)}</span>
                        <span className="tabular-nums font-medium">{batch.weightProgressPct}%</span>
                      </div>
                      <Progress value={batch.weightProgressPct} />
                    </div>
                  </div>

                  {/* Tabel Simulasi Pembagian Biaya */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[#F6F7F8] text-[#626E76] font-semibold border-b border-[#E3E7EA]">
                        <tr>
                          <th className="py-2.5 px-4">Penjual / Toko</th>
                          <th className="py-2.5 px-3 text-right">Paket</th>
                          <th className="py-2.5 px-3 text-right">Berat</th>
                          <th className="py-2.5 px-3 text-right">Porsi berat</th>
                          <th className="py-2.5 px-3 text-right">Biaya sebelum fee</th>
                          <th className="py-2.5 px-3 text-right">Fee</th>
                          <th className="py-2.5 px-4 text-right font-bold text-[#182126]">Estimasi tagihan</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E3E7EA]">
                        {batch.sellerProjections.map((proj) => {
                          const isMe = proj.sellerId === currentUserId;
                          return (
                            <tr key={proj.sellerId} className={isMe ? "bg-[#F4F9F8]" : "hover:bg-[#FAFAFA]"}>
                              <td className="py-2.5 px-4">
                                <span className="font-semibold text-[#182126]">
                                  {proj.sellerName}
                                </span>
                                {isMe && (
                                  <span className="ml-1.5 rounded bg-[#E3E7EA] px-1.5 py-0.2 text-[10px] font-medium text-[#182126]">
                                    Anda
                                  </span>
                                )}
                                <span className="text-[11px] text-[#626E76] block mt-0.5">
                                  {proj.storeName}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-[#182126]">
                                {proj.packageCount}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-[#182126]">
                                {formatWeight(proj.weightGram)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-[#626E76]">
                                {proj.weightPercentage}%
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-[#626E76]">
                                {formatRupiah(proj.costBeforeFee)}
                              </td>
                              <td className="py-2.5 px-3 text-right tabular-nums text-[#626E76]">
                                {formatRupiah(proj.platformFee)}
                              </td>
                              <td className="py-2.5 px-4 text-right tabular-nums font-bold text-[#17685F]">
                                {formatRupiah(proj.finalTotalCharge)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
