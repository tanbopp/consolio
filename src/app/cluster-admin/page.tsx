"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  X,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DraftStatusBadge,
  GroupPickupStatusBadge,
} from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { COURIER_LABELS, PICKUP_WINDOW_LABELS } from "@/lib/constants";
import { formatRupiah, formatWeight, formatDateId } from "@/lib/utils";

export default function ClusterAdminDashboardPage() {
  const queryClient = useQueryClient();
  const [pickupTimes, setPickupTimes] = useState<Record<string, string>>({});
  const [forceConfirmKey, setForceConfirmKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const { data } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Gagal memuat dashboard admin cluster");
      return res.json();
    },
  });

  const moderateMemberMutation = useMutation({
    mutationFn: async (payload: {
      memberId: string;
      decision: "ACTIVE" | "REJECTED";
    }) => {
      const res = await fetch("/api/clusters", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "MODERATE_MEMBER", ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses anggota");
      return json;
    },
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["clusters"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const createPickupMutation = useMutation({
    mutationFn: async (payload: {
      clusterId: string;
      pickupDate: string;
      pickupWindow: string;
      courier: string;
      pickupTime: string;
      forceBelowMinimum: boolean;
    }) => {
      const res = await fetch("/api/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal membuat Pickup Bersama");
      return json;
    },
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      setForceConfirmKey(null);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pickups"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const updatePickupMutation = useMutation({
    mutationFn: async (payload: { pickupId: string; action: string }) => {
      const res = await fetch("/api/pickups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memperbarui pickup");
      return json;
    },
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["pickups"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const stats = data?.clusterAdminStats;
  const pendingRequests = stats?.pendingRequests || [];
  const clusterBatches = stats?.clusterBatches || [];
  const pickupsToConfirm = stats?.pickupsToConfirm || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
              Operasional Admin Cluster
            </h1>
            <p className="text-xs text-[#626E76] mt-0.5">
              Persetujuan anggota penjual, penjadwalan pickup bersama, dan konfirmasi penjemputan kurir.
            </p>
          </div>
          <Link href="/cluster-admin/manage">
            <Button variant="outline" size="sm" className="h-8 text-xs font-semibold">
              <span>Pengaturan Cluster</span>
            </Button>
          </Link>
        </div>

        {feedback && (
          <div
            className={`rounded border px-3 py-2 text-xs font-medium flex items-center justify-between ${
              feedback.type === "success"
                ? "border-[#C3E6D3] bg-[#EAF5EF] text-[#144D33]"
                : "border-[#F8D2CF] bg-[#FDF2F1] text-[#911D13]"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-[11px] underline ml-3"
            >
              Tutup
            </button>
          </div>
        )}

        {/* Summary Strip Admin Cluster */}
        <div className="rounded border border-[#E3E7EA] bg-white p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#E3E7EA]">
            <div className="py-2 sm:py-0 sm:px-3 first:pl-0">
              <span className="text-[11px] font-medium text-[#626E76] block">Penjual aktif</span>
              <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                {stats?.activeSellersCount || 0}
              </p>
              <span className="text-[11px] text-[#626E76]">
                {pendingRequests.length} pending
              </span>
            </div>

            <div className="py-2 sm:py-0 sm:px-3">
              <span className="text-[11px] font-medium text-[#626E76] block">Draft hari ini</span>
              <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                {stats?.activeDraftsTodayCount || 0}
              </p>
              <span className="text-[11px] text-[#626E76]">
                Dalam {clusterBatches.length} grup antrean
              </span>
            </div>

            <div className="py-2 sm:py-0 sm:px-3">
              <span className="text-[11px] font-medium text-[#626E76] block">Pickup bersama</span>
              <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                {stats?.totalGroupPickupsCount || 0} kali
              </p>
              <span className="text-[11px] text-[#626E76]">
                {pickupsToConfirm.length} perlu konfirmasi
              </span>
            </div>

            <div className="py-2 sm:py-0 sm:px-3">
              <span className="text-[11px] font-medium text-[#626E76] block">Berat terkonsolidasi</span>
              <p className="text-lg font-bold text-[#182126] mt-0.5 tabular-nums">
                {formatWeight(stats?.totalConsolidatedWeightGram || 0)}
              </p>
              <span className="text-[11px] text-[#626E76]">
                Total selesai
              </span>
            </div>

            <div className="py-2 sm:py-0 sm:px-3 last:pr-0">
              <span className="text-[11px] font-medium text-[#626E76] block">Total biaya pickup</span>
              <p className="text-lg font-bold text-[#17685F] mt-0.5 tabular-nums">
                {formatRupiah(stats?.totalPickupCostRp || 0)}
              </p>
              <span className="text-[11px] text-[#626E76]">
                Termasuk fee platform
              </span>
            </div>
          </div>
        </div>

        {/* 1. Pickup yang Perlu Dikonfirmasi */}
        {pickupsToConfirm.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-semibold text-[#182126] uppercase tracking-wider">
              Pickup yang Perlu Dikonfirmasi ({pickupsToConfirm.length})
            </h2>

            <div className="rounded border border-[#E3E7EA] bg-white divide-y divide-[#E3E7EA]">
              {pickupsToConfirm.map((gp: {
                id: string;
                code: string;
                clusterName: string;
                courier: string;
                pickupDate: string;
                pickupTime: string;
                totalPackages: number;
                totalWeightGram: number;
                totalCost: number;
                status: string;
              }) => (
                <div key={gp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link href={`/pickups/${gp.id}`} className="font-semibold text-xs text-[#17685F] hover:underline inline-flex items-center gap-1">
                        <span>{gp.code}</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      <GroupPickupStatusBadge status={gp.status} />
                      <span className="text-xs text-[#626E76]">
                        {COURIER_LABELS[gp.courier] || gp.courier}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#182126]">
                      {gp.clusterName} — {formatDateId(gp.pickupDate)} Pukul {gp.pickupTime} WIB
                    </p>
                    <p className="text-xs text-[#626E76]">
                      {gp.totalPackages} paket • {formatWeight(gp.totalWeightGram)} • Tagihan total: {formatRupiah(gp.totalCost)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      disabled={updatePickupMutation.isPending}
                      onClick={() =>
                        updatePickupMutation.mutate({
                          pickupId: gp.id,
                          action: "COMPLETE_PICKUP",
                        })
                      }
                      className="h-8 text-xs font-semibold"
                    >
                      Konfirmasi Kurir Telah Pickup
                    </Button>
                    <Link href={`/pickups/${gp.id}`}>
                      <Button size="sm" variant="outline" className="h-8 text-xs">
                        Rincian
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Antrean Grup Draft Paket (Jadwalkan Pickup) */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#182126] uppercase tracking-wider">
            Antrean Draft Paket Menuju Jadwal Pickup
          </h2>

          {clusterBatches.length === 0 ? (
            <div className="rounded border border-[#E3E7EA] bg-white p-6 text-center text-xs text-[#8D98A0]">
              Tidak ada antrean draft paket yang menunggu dijadwalkan saat ini.
            </div>
          ) : (
            <div className="space-y-4">
              {clusterBatches.map((batch: {
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
                  finalTotalCharge: number;
                }>;
              }) => {
                const timeVal =
                  pickupTimes[batch.groupKey] ||
                  (batch.pickupWindow === "MORNING"
                    ? "09:30"
                    : batch.pickupWindow === "AFTERNOON"
                    ? "13:30"
                    : batch.pickupWindow === "EVENING"
                    ? "16:00"
                    : "19:30");

                return (
                  <div key={batch.groupKey} className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
                    <div className="p-4 border-b border-[#E3E7EA] flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-[#FAFAFA]">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#182126]">
                            {batch.clusterCode} • {COURIER_LABELS[batch.courier] || batch.courier}
                          </span>
                          <span className="text-xs text-[#626E76]">
                            {formatDateId(batch.pickupDate, true)} (
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
                          {batch.totalPackages} paket ({formatWeight(batch.totalWeightGram)}) dari {batch.sellerProjections.length} penjual
                        </p>
                      </div>

                      {/* Kontrol Penjadwalan */}
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-[#626E76]">Jam jemput:</span>
                          <Input
                            type="time"
                            value={timeVal}
                            onChange={(e) =>
                              setPickupTimes({
                                ...pickupTimes,
                                [batch.groupKey]: e.target.value,
                              })
                            }
                            className="h-8 w-24 text-xs tabular-nums"
                          />
                        </div>

                        {batch.isReadyForPickup ? (
                          <Button
                            size="sm"
                            className="h-8 text-xs font-semibold"
                            disabled={createPickupMutation.isPending}
                            onClick={() =>
                              createPickupMutation.mutate({
                                clusterId: batch.clusterId,
                                pickupDate: batch.pickupDate,
                                pickupWindow: batch.pickupWindow,
                                courier: batch.courier,
                                pickupTime: timeVal,
                                forceBelowMinimum: false,
                              })
                            }
                          >
                            Buat Pickup Bersama
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs"
                            onClick={() =>
                              setForceConfirmKey(
                                forceConfirmKey === batch.groupKey
                                  ? null
                                  : batch.groupKey
                              )
                            }
                          >
                            Paksa Jadwalkan
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Warning Konfirmasi Paksa */}
                    {forceConfirmKey === batch.groupKey && !batch.isReadyForPickup && (
                      <div className="p-3 bg-[#FEF7E6] border-b border-[#F9E2B6] text-xs text-[#734C00] flex items-center justify-between gap-3">
                        <p>
                          Syarat kuota minimum belum tercapai. Jika dijadwalkan sekarang, biaya pickup akan dibagi ke lebih sedikit penjual sehingga biaya per penjual lebih tinggi.
                        </p>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => setForceConfirmKey(null)}
                            className="text-xs text-[#734C00] underline"
                          >
                            Batal
                          </button>
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-[#9A6700] text-white hover:bg-[#734C00]"
                            disabled={createPickupMutation.isPending}
                            onClick={() =>
                              createPickupMutation.mutate({
                                clusterId: batch.clusterId,
                                pickupDate: batch.pickupDate,
                                pickupWindow: batch.pickupWindow,
                                courier: batch.courier,
                                pickupTime: timeVal,
                                forceBelowMinimum: true,
                              })
                            }
                          >
                            Lanjutkan Jadwalkan
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Progress Kuota */}
                    <div className="p-4 border-b border-[#E3E7EA] grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="flex justify-between text-[#626E76] mb-1 text-[11px]">
                          <span>Paket: {batch.totalPackages} dari {batch.minPackages}</span>
                          <span className="tabular-nums">{batch.packageProgressPct}%</span>
                        </div>
                        <Progress value={batch.packageProgressPct} />
                      </div>
                      <div>
                        <div className="flex justify-between text-[#626E76] mb-1 text-[11px]">
                          <span>Berat: {formatWeight(batch.totalWeightGram)} dari {formatWeight(batch.minTotalWeightGram)}</span>
                          <span className="tabular-nums">{batch.weightProgressPct}%</span>
                        </div>
                        <Progress value={batch.weightProgressPct} />
                      </div>
                    </div>

                    {/* Ringkasan Penjual */}
                    <div className="p-3 bg-white flex flex-wrap gap-2 text-xs">
                      {batch.sellerProjections.map((s) => (
                        <div key={s.sellerId} className="rounded border border-[#E3E7EA] px-2.5 py-1 text-[11px]">
                          <span className="font-semibold text-[#182126]">{s.sellerName}</span>{" "}
                          <span className="text-[#626E76]">({s.packageCount} pkt • {formatWeight(s.weightGram)})</span> →{" "}
                          <span className="font-semibold text-[#17685F] tabular-nums">{formatRupiah(s.finalTotalCharge)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Permintaan Gabung Cluster */}
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-[#182126] uppercase tracking-wider">
            Permintaan Gabung Cluster ({pendingRequests.length})
          </h2>

          {pendingRequests.length === 0 ? (
            <div className="rounded border border-[#E3E7EA] bg-white p-6 text-center text-xs text-[#8D98A0]">
              Tidak ada permintaan gabung cluster baru yang menunggu persetujuan.
            </div>
          ) : (
            <div className="rounded border border-[#E3E7EA] bg-white divide-y divide-[#E3E7EA]">
              {pendingRequests.map((req: {
                id: string;
                userName: string;
                userEmail: string;
                userPhone: string;
                storeName: string;
                businessType: string;
                address: string;
                clusterName: string;
                clusterCode: string;
              }) => (
                <div key={req.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-[#182126]">
                      {req.userName} — {req.storeName}
                    </p>
                    <p className="text-[#626E76]">
                      {req.businessType} • WA: {req.userPhone} • Email: {req.userEmail}
                    </p>
                    <p className="text-[#626E76]">
                      Alamat: {req.address} → Cluster: <strong>{req.clusterName} ({req.clusterCode})</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      size="sm"
                      className="h-8 text-xs font-semibold gap-1"
                      disabled={moderateMemberMutation.isPending}
                      onClick={() =>
                        moderateMemberMutation.mutate({
                          memberId: req.id,
                          decision: "ACTIVE",
                        })
                      }
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>Setujui</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs text-[#B42318] border-[#E3E7EA] hover:bg-[#FDF2F1] gap-1"
                      disabled={moderateMemberMutation.isPending}
                      onClick={() =>
                        moderateMemberMutation.mutate({
                          memberId: req.id,
                          decision: "REJECTED",
                        })
                      }
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Tolak</span>
                    </Button>
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
