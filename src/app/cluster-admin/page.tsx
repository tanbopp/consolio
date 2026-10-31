"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  Package,
  Truck,
  Scale,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  CalendarClock,
  ShieldCheck,
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
import { Input } from "@/components/ui/input";
import {
  Badge,
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

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Gagal memuat dashboard admin cluster");
      return res.json();
    },
  });

  // Mutation: Setujui / Tolak permintaan gabung cluster
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

  // Mutation: Buat Jadwal Pickup Bersama dari Batch
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

  // Mutation: Konfirmasi Pickup Bersama Selesai (COMPLETED) atau Batal
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Dashboard Admin Cluster
            </h1>
            <p className="text-sm text-slate-600">
              Kelola persetujuan anggota, pantau kuota konsolidasi paket, buat
              jadwal Pickup Bersama, dan konfirmasi penjemputan kurir.
            </p>
          </div>
          <Link href="/cluster-admin/manage">
            <Button variant="secondary" className="gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              <span>Pengaturan Cluster & Semua Draft</span>
            </Button>
          </Link>
        </div>

        {feedback && (
          <div
            className={`rounded-xl border p-4 text-sm font-medium flex items-center justify-between ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            <span>{feedback.text}</span>
            <button
              type="button"
              onClick={() => setFeedback(null)}
              className="text-xs font-bold underline ml-4"
            >
              Tutup
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-slate-200/70 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* 5 Kartu Statistik Utama Admin Cluster (4.8) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="border-l-4 border-l-teal-700">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Penjual Aktif
                    </span>
                    <Users className="h-4 w-4 text-teal-700" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {stats?.activeSellersCount || 0} UMKM
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {pendingRequests.length} permintaan menunggu ACC
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Draft Aktif Hari Ini
                    </span>
                    <Package className="h-4 w-4 text-orange-600" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {stats?.activeDraftsTodayCount || 0} Paket
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dalam {clusterBatches.length} grup antrean
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Jumlah Pickup Bersama
                    </span>
                    <Truck className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-slate-900">
                    {stats?.totalGroupPickupsCount || 0} Kali
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {pickupsToConfirm.length} perlu dikonfirmasi
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500">
                      Total Berat Terkonsolidasi
                    </span>
                    <Scale className="h-4 w-4 text-emerald-600" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-teal-900">
                    {formatWeight(stats?.totalConsolidatedWeightGram || 0)}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Dari seluruh pickup selesai
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-teal-900 text-white border-none">
                <CardContent className="pt-5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-teal-200">
                      Total Biaya Pickup
                    </span>
                    <Wallet className="h-4 w-4 text-orange-400" />
                  </div>
                  <p className="mt-2 text-2xl font-extrabold text-white">
                    {formatRupiah(stats?.totalPickupCostRp || 0)}
                  </p>
                  <p className="text-[11px] text-teal-200 mt-0.5">
                    Termasuk fee platform
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Bagian 1: Daftar Pickup Bersama yang Perlu Dikonfirmasi Selesai */}
            {pickupsToConfirm.length > 0 && (
              <Card className="border-2 border-emerald-600 bg-emerald-50/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CheckCircle2 className="h-5 w-5 text-emerald-700" />
                    Daftar Pickup Bersama yang Perlu Dikonfirmasi (
                    {pickupsToConfirm.length})
                  </CardTitle>
                  <CardDescription>
                    Klik <strong>Konfirmasi Kurir Telah Pickup</strong> setelah
                    kurir mengambil paket untuk mengunci pembagian biaya
                    antarpenjual.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pickupsToConfirm.map(
                    (gp: {
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
                      <div
                        key={gp.id}
                        className="rounded-xl bg-white border border-emerald-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/pickups/${gp.id}`}
                              className="font-mono text-sm font-extrabold text-teal-900 hover:underline flex items-center gap-1"
                            >
                              <span>{gp.code}</span>
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                            <GroupPickupStatusBadge status={gp.status} />
                            <Badge variant="teal">
                              {COURIER_LABELS[gp.courier]}
                            </Badge>
                          </div>
                          <p className="text-sm font-bold text-slate-900">
                            {gp.clusterName} — {formatDateId(gp.pickupDate)}{" "}
                            Pukul {gp.pickupTime} WIB
                          </p>
                          <p className="text-xs text-slate-600">
                            {gp.totalPackages} Paket •{" "}
                            {formatWeight(gp.totalWeightGram)} • Total Tagihan:{" "}
                            <strong>{formatRupiah(gp.totalCost)}</strong>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            size="sm"
                            variant="cta"
                            disabled={updatePickupMutation.isPending}
                            onClick={() =>
                              updatePickupMutation.mutate({
                                pickupId: gp.id,
                                action: "COMPLETE_PICKUP",
                              })
                            }
                            className="gap-1.5"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            <span>
                              Konfirmasi Kurir Telah Pickup (COMPLETED)
                            </span>
                          </Button>
                          <Link href={`/pickups/${gp.id}`}>
                            <Button size="sm" variant="outline">
                              Lihat Rincian
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bagian 2: Grup Draft Paket Menuju Jadwal Pickup Bersama */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarClock className="h-5 w-5 text-teal-700" />
                  Grup Draft Paket Dalam Cluster (Buat Jadwal Pickup Bersama)
                </CardTitle>
                <CardDescription>
                  Ketika kuota minimum tercapai, status otomatis menjadi{" "}
                  <strong>Siap Pickup</strong>. Anda juga dapat memaksa membuat
                  pickup bersama meskipun minimum belum tercapai.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {clusterBatches.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">
                    Tidak ada grup draft yang menunggu dijadwalkan saat ini.
                  </p>
                ) : (
                  clusterBatches.map(
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
                        <div
                          key={batch.groupKey}
                          className={`rounded-xl border p-4 sm:p-5 space-y-4 ${
                            batch.isReadyForPickup
                              ? "border-2 border-amber-400 bg-amber-50/30"
                              : "border-slate-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold bg-teal-900 text-white px-2 py-0.5 rounded">
                                  {batch.clusterCode}
                                </span>
                                <Badge variant="teal">
                                  {COURIER_LABELS[batch.courier]}
                                </Badge>
                                <span className="text-xs font-bold text-slate-800">
                                  📅 {formatDateId(batch.pickupDate, true)} •{" "}
                                  {
                                    PICKUP_WINDOW_LABELS[batch.pickupWindow]
                                      ?.label
                                  }
                                </span>
                                <DraftStatusBadge
                                  status={
                                    batch.isReadyForPickup
                                      ? "READY_FOR_PICKUP"
                                      : "QUEUED"
                                  }
                                />
                              </div>
                              <p className="text-sm font-bold text-slate-900 pt-1">
                                {batch.totalPackages} Paket Terkumpul (
                                {formatWeight(batch.totalWeightGram)}) dari{" "}
                                {batch.sellerProjections.length} Penjual
                              </p>
                            </div>

                            {/* Form Jam Pickup & Tombol Buat Pickup Bersama */}
                            <div className="flex flex-wrap items-center gap-2.5">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-semibold text-slate-700">
                                  Jam Jemput:
                                </span>
                                <Input
                                  type="time"
                                  value={timeVal}
                                  onChange={(e) =>
                                    setPickupTimes({
                                      ...pickupTimes,
                                      [batch.groupKey]: e.target.value,
                                    })
                                  }
                                  className="h-9 w-28 text-xs font-bold"
                                />
                              </div>

                              {batch.isReadyForPickup ? (
                                <Button
                                  variant="cta"
                                  size="sm"
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
                                  Buat Pickup Bersama Sekarang
                                </Button>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    setForceConfirmKey(
                                      forceConfirmKey === batch.groupKey
                                        ? null
                                        : batch.groupKey
                                    )
                                  }
                                  className="border-amber-400 text-amber-900 hover:bg-amber-50"
                                >
                                  Paksa Buat Pickup Bersama
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Peringatan Paksa Pickup di Bawah Syarat Minimum (4.4) */}
                          {forceConfirmKey === batch.groupKey &&
                            !batch.isReadyForPickup && (
                              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 text-xs space-y-2">
                                <div className="flex items-start gap-2 text-amber-950 font-bold">
                                  <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                                  <span>
                                    Peringatan: Kuota Minimum Belum Tercapai (
                                    {batch.totalPackages}/{batch.minPackages}{" "}
                                    paket atau{" "}
                                    {formatWeight(batch.totalWeightGram)}/
                                    {formatWeight(batch.minTotalWeightGram)})
                                  </span>
                                </div>
                                <p className="text-amber-800">
                                  Jika Anda memaksa membuat Pickup Bersama
                                  sekarang, biaya pickup dasar{" "}
                                  {formatRupiah(batch.basePickupFee)} (+fee{" "}
                                  {batch.platformFeePercent}%) hanya akan dibagi
                                  ke {batch.sellerProjections.length} penjual
                                  sehingga{" "}
                                  <strong>
                                    biaya per penjual akan lebih tinggi
                                  </strong>
                                  .
                                </p>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setForceConfirmKey(null)}
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="cta"
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
                                    Ya, Paksa Jadwalkan Pickup Bersama
                                  </Button>
                                </div>
                              </div>
                            )}

                          {/* Progress Bar */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div>
                              <div className="flex justify-between font-medium text-slate-600 mb-1">
                                <span>
                                  Paket: {batch.totalPackages} dari{" "}
                                  {batch.minPackages} paket
                                </span>
                                <span>{batch.packageProgressPct}%</span>
                              </div>
                              <Progress value={batch.packageProgressPct} />
                            </div>
                            <div>
                              <div className="flex justify-between font-medium text-slate-600 mb-1">
                                <span>
                                  Berat: {formatWeight(batch.totalWeightGram)}{" "}
                                  dari {formatWeight(batch.minTotalWeightGram)}
                                </span>
                                <span>{batch.weightProgressPct}%</span>
                              </div>
                              <Progress value={batch.weightProgressPct} />
                            </div>
                          </div>

                          {/* Ringkasan Pembagian Biaya Penjual di Grup Ini */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {batch.sellerProjections.map((s) => (
                              <div
                                key={s.sellerId}
                                className="rounded-lg bg-slate-50 border border-slate-200 px-3 py-1.5 text-xs"
                              >
                                <span className="font-bold text-slate-800">
                                  {s.sellerName}
                                </span>{" "}
                                ({s.packageCount} pkt •{" "}
                                {formatWeight(s.weightGram)} /{" "}
                                {s.weightPercentage}%) →{" "}
                                <strong className="text-teal-800">
                                  {formatRupiah(s.finalTotalCharge)}
                                </strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )
                )}
              </CardContent>
            </Card>

            {/* Bagian 3: Daftar Permintaan Gabung Cluster (PENDING) */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-teal-700" />
                  Daftar Permintaan Gabung Cluster ({pendingRequests.length})
                </CardTitle>
                <CardDescription>
                  Setujui atau tolak penjual UMKM di sekitar area fisik cluster
                  Anda.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    Tidak ada permintaan gabung cluster yang menunggu
                    persetujuan.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {pendingRequests.map(
                      (req: {
                        id: string;
                        userName: string;
                        userEmail: string;
                        userPhone: string;
                        storeName: string;
                        businessType: string;
                        address: string;
                        clusterName: string;
                        clusterCode: string;
                        joinedAt: string;
                      }) => (
                        <div
                          key={req.id}
                          className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <Badge variant="orange">MENUNGGU ACC</Badge>
                              <span className="font-bold text-slate-900 text-sm">
                                {req.userName} — {req.storeName}
                              </span>
                            </div>
                            <p className="text-slate-600">
                              Jenis Usaha: {req.businessType} • WA:{" "}
                              {req.userPhone} • Email: {req.userEmail}
                            </p>
                            <p className="text-slate-600">
                              Alamat Toko: <strong>{req.address}</strong> → Ingin
                              gabung ke{" "}
                              <strong className="text-teal-800">
                                {req.clusterName} ({req.clusterCode})
                              </strong>
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="sm"
                              className="gap-1"
                              disabled={moderateMemberMutation.isPending}
                              onClick={() =>
                                moderateMemberMutation.mutate({
                                  memberId: req.id,
                                  decision: "ACTIVE",
                                })
                              }
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Setujui</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-1"
                              disabled={moderateMemberMutation.isPending}
                              onClick={() =>
                                moderateMemberMutation.mutate({
                                  memberId: req.id,
                                  decision: "REJECTED",
                                })
                              }
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Tolak</span>
                            </Button>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}

