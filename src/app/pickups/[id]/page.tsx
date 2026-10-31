"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Share2,
  CheckCircle2,
  Lock,
  Calculator,
  Package,
  MapPin,
  ArrowLeft,
  Play,
  XCircle,
  Check,
  ShieldCheck,
  History,
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
import { COURIER_LABELS, PICKUP_WINDOW_LABELS } from "@/lib/constants";
import { formatRupiah, formatWeight, formatDateId } from "@/lib/utils";

export default function PickupDetailPage() {
  const params = useParams();
  const pickupId = String(params?.id || "");
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const user = session?.user as
    | { id?: string; role?: string }
    | undefined;
  const isAdminRole =
    user?.role === "CLUSTER_ADMIN" || user?.role === "PLATFORM_ADMIN";

  const { data, isLoading, error } = useQuery({
    queryKey: ["pickup-detail", pickupId],
    queryFn: async () => {
      const res = await fetch(
        `/api/pickups?id=${encodeURIComponent(pickupId)}`
      );
      if (!res.ok) throw new Error("Pickup Bersama tidak ditemukan");
      return res.json();
    },
    enabled: !!pickupId,
  });

  const actionMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch("/api/pickups", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pickupId: data?.pickup?.id, ...payload }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal memproses aksi");
      return json;
    },
    onSuccess: (res) => {
      setFeedback({ type: "success", text: res.message });
      queryClient.invalidateQueries({ queryKey: ["pickup-detail", pickupId] });
      queryClient.invalidateQueries({ queryKey: ["pickups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (err: Error) => {
      setFeedback({ type: "error", text: err.message });
    },
  });

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const pickup = data?.pickup;
  const logs = data?.logs || [];

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href="/history"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700 hover:underline mb-1"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Kembali ke Riwayat Pengiriman
            </Link>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl font-extrabold text-slate-900">
                Detail Pickup Bersama {pickup?.code || ""}
              </h1>
              {pickup && <GroupPickupStatusBadge status={pickup.status} />}
            </div>
            <p className="text-sm text-slate-600 mt-0.5">
              Rincian pembagian biaya transparan per penjual dan daftar paket
              yang ikut serta.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleCopyShareLink}
            className="gap-2"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Link Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="h-4 w-4 text-teal-700" />
                <span>Bagikan Link Pickup</span>
              </>
            )}
          </Button>
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
          <div className="h-64 rounded-xl bg-slate-200/70 animate-pulse" />
        ) : error || !pickup ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-base font-bold text-slate-800">
                Data Pickup Bersama Tidak Ditemukan
              </p>
              <Link href="/dashboard">
                <Button size="sm">Kembali ke Dashboard</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Ringkasan Utama Pickup Bersama */}
            <Card className="border-t-4 border-t-teal-700">
              <CardContent className="p-5 sm:p-6 space-y-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-extrabold bg-teal-900 text-white px-2.5 py-0.5 rounded">
                        {pickup.code}
                      </span>
                      <Badge variant="teal">
                        {COURIER_LABELS[pickup.courier] || pickup.courier}
                      </Badge>
                      {pickup.costLocked && (
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 gap-1">
                          <Lock className="h-3 w-3" />
                          Biaya Terkunci Permanen
                        </Badge>
                      )}
                      {pickup.forcedBelowMin && (
                        <Badge variant="orange">
                          Dibuat Paksa di Bawah Kuota Minimum
                        </Badge>
                      )}
                    </div>
                    <h2 className="text-lg font-extrabold text-slate-900 pt-1">
                      Cluster: {pickup.clusterName} ({pickup.clusterCode})
                    </h2>
                    <p className="text-xs text-slate-600 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-teal-700" />
                      Titik Kumpul: {pickup.centerAddress} • Koordinator:{" "}
                      <strong>{pickup.adminName}</strong>
                    </p>
                  </div>

                  {/* Kontrol Admin Cluster jika belum COMPLETED */}
                  {isAdminRole &&
                    pickup.status !== "COMPLETED" &&
                    pickup.status !== "CANCELLED" && (
                      <div className="flex flex-wrap items-center gap-2">
                        {pickup.status === "SCHEDULED" && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="gap-1.5"
                            disabled={actionMutation.isPending}
                            onClick={() =>
                              actionMutation.mutate({ action: "START_PICKUP" })
                            }
                          >
                            <Play className="h-3.5 w-3.5" />
                            <span>Tandai Kurir Sedang Menjemput</span>
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="cta"
                          className="gap-1.5"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({ action: "COMPLETE_PICKUP" })
                          }
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Konfirmasi Pickup Selesai & Kunci Biaya</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          disabled={actionMutation.isPending}
                          onClick={() =>
                            actionMutation.mutate({ action: "CANCEL_PICKUP" })
                          }
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          <span>Batalkan</span>
                        </Button>
                      </div>
                    )}
                </div>

                {/* Grid Metrik Pickup */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                    <span className="text-slate-500 block">
                      Tanggal & Jam Pickup
                    </span>
                    <strong className="text-sm text-slate-900 mt-0.5 block">
                      {formatDateId(pickup.pickupDate)} • {pickup.pickupTime}{" "}
                      WIB
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Jendela:{" "}
                      {PICKUP_WINDOW_LABELS[pickup.pickupWindow]?.label}
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                    <span className="text-slate-500 block">
                      Total Paket & Penjual
                    </span>
                    <strong className="text-sm text-slate-900 mt-0.5 block">
                      {pickup.totalPackages} Paket ({pickup.payments.length}{" "}
                      UMKM)
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      1x Penjemputan Kolektif
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                    <span className="text-slate-500 block">
                      Total Berat Konsolidasi
                    </span>
                    <strong className="text-sm text-teal-800 mt-0.5 block">
                      {formatWeight(pickup.totalWeightGram)}
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      ({pickup.totalWeightGram.toLocaleString("id-ID")} gram)
                    </span>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/80">
                    <span className="text-slate-500 block">
                      Biaya Pickup Dasar + Fee
                    </span>
                    <strong className="text-sm text-slate-900 mt-0.5 block">
                      {formatRupiah(pickup.basePickupFee)} +{" "}
                      {pickup.platformFeePercent}%
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Fee Platform:{" "}
                      {formatRupiah(
                        Math.round(
                          pickup.basePickupFee *
                            (pickup.platformFeePercent / 100)
                        )
                      )}
                    </span>
                  </div>

                  <div className="rounded-xl bg-teal-900 text-white p-3">
                    <span className="text-teal-200 block">
                      Total Biaya Pickup + Fee
                    </span>
                    <strong className="text-base text-orange-400 mt-0.5 block">
                      {formatRupiah(pickup.totalCost)}
                    </strong>
                    <span className="text-[11px] text-teal-100">
                      Selisih Pembulatan: {formatRupiah(pickup.roundingDiff)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabel Rincian Pembagian Biaya Per Penjual (4.6) */}
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calculator className="h-5 w-5 text-teal-700" />
                      Rincian Pembagian Biaya Per Penjual
                    </CardTitle>
                    <CardDescription>
                      Rumus:{" "}
                      <code className="bg-slate-100 px-1.5 py-0.5 rounded text-teal-900 font-semibold">
                        biaya_penjual = (berat_penjual / total_berat) ×
                        biaya_pickup × (1 + fee_platform)
                      </code>
                    </CardDescription>
                  </div>
                  {pickup.costLocked && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                      <ShieldCheck className="h-4 w-4" />
                      Telah Dikunci Sesuai Aturan Bisnis
                    </span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-3">Penjual & Toko</th>
                        <th className="py-3 px-3 text-center">Jml Paket</th>
                        <th className="py-3 px-3 text-right">Berat Penjual</th>
                        <th className="py-3 px-3 text-right">% Berat</th>
                        <th className="py-3 px-3 text-right">
                          Biaya Pickup Sebelum Fee
                        </th>
                        <th className="py-3 px-3 text-right">
                          Fee Platform ({pickup.platformFeePercent}%)
                        </th>
                        <th className="py-3 px-3 text-right">Total Tagihan</th>
                        <th className="py-3 px-3 text-right">
                          Penghematan
                        </th>
                        <th className="py-3 px-3 text-center">Status Bayar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pickup.payments.map(
                        (pay: {
                          id: string;
                          sellerId: string;
                          sellerName: string;
                          storeName: string;
                          packageCount: number;
                          totalWeightGram: number;
                          weightPercent: number;
                          costShare: number;
                          platformFee: number;
                          amount: number;
                          estimatedSavings: number;
                          status: string;
                        }) => {
                          const isMe = pay.sellerId === user?.id;
                          return (
                            <tr
                              key={pay.id}
                              className={
                                isMe
                                  ? "bg-teal-50/90 font-semibold"
                                  : "hover:bg-slate-50"
                              }
                            >
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900">
                                    {pay.sellerName}
                                  </span>
                                  {isMe && (
                                    <Badge className="bg-teal-700 text-white border-none text-[10px]">
                                      Anda
                                    </Badge>
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 block">
                                  {pay.storeName}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                {pay.packageCount} paket
                              </td>
                              <td className="py-3 px-3 text-right font-medium">
                                {formatWeight(pay.totalWeightGram)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {pay.weightPercent}%
                              </td>
                              <td className="py-3 px-3 text-right">
                                {formatRupiah(pay.costShare)}
                              </td>
                              <td className="py-3 px-3 text-right">
                                {formatRupiah(pay.platformFee)}
                              </td>
                              <td className="py-3 px-3 text-right font-extrabold text-teal-900 text-sm">
                                {formatRupiah(pay.amount)}
                              </td>
                              <td className="py-3 px-3 text-right font-bold text-emerald-700">
                                {formatRupiah(pay.estimatedSavings)}
                              </td>
                              <td className="py-3 px-3 text-center">
                                {pay.status === "PAID" ? (
                                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">
                                    LUNAS
                                  </Badge>
                                ) : (
                                  <div className="flex items-center justify-center gap-1.5">
                                    <Badge variant="orange">BELUM BAYAR</Badge>
                                    {(isMe || isAdminRole) && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 px-2 text-[11px]"
                                        onClick={() =>
                                          actionMutation.mutate({
                                            action: "MARK_PAYMENT_PAID",
                                            paymentId: pay.id,
                                          })
                                        }
                                      >
                                        Tandai Lunas
                                      </Button>
                                    )}
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Catatan Pembulatan Transparan */}
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span>
                    💡 <strong>Keterangan Pembulatan:</strong> Pembulatan ke
                    Rupiah terdekat. Total tagihan penjual dijamin tidak
                    melebihi plafon Biaya Pickup + Fee Platform (
                    {formatRupiah(pickup.totalCost)}).
                  </span>
                  <span className="font-bold text-slate-800 shrink-0">
                    Selisih / Sisa Pembulatan Admin Cluster:{" "}
                    {formatRupiah(pickup.roundingDiff)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Daftar Paket yang Ikut Serta & Activity Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Package className="h-5 w-5 text-teal-700" />
                      Daftar Seluruh Paket yang Ikut Serta (
                      {pickup.items.length} Paket)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="divide-y divide-slate-100">
                      {pickup.items.map(
                        (item: {
                          id: string;
                          sellerName: string;
                          storeName: string;
                          recipientName: string;
                          recipientPhone: string;
                          destinationAddress: string;
                          city: string;
                          province: string;
                          weightGram: number;
                          totalCharge: number;
                          draftStatus: string;
                        }) => (
                          <div
                            key={item.id}
                            className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-teal-800">
                                  {item.storeName} ({item.sellerName})
                                </span>
                                <span>→</span>
                                <span className="font-bold text-slate-900">
                                  {item.recipientName}
                                </span>
                              </div>
                              <p className="text-slate-500">
                                Tujuan: {item.destinationAddress}, {item.city},{" "}
                                {item.province} ({item.recipientPhone})
                              </p>
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-semibold text-slate-700">
                                {formatWeight(item.weightGram)}
                              </span>
                              <span className="font-bold text-teal-900">
                                {formatRupiah(item.totalCharge)}
                              </span>
                              <DraftStatusBadge status={item.draftStatus} />
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <History className="h-5 w-5 text-teal-700" />
                      Log Aktivitas Pickup
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {logs.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        Belum ada catatan log untuk pickup ini.
                      </p>
                    ) : (
                      <div className="space-y-3 text-xs">
                        {logs.map(
                          (l: {
                            id: string;
                            actorName: string;
                            summary: string;
                            details?: string;
                            createdAt: string;
                          }) => (
                            <div
                              key={l.id}
                              className="rounded-lg border border-slate-100 bg-slate-50 p-3 space-y-1"
                            >
                              <p className="font-semibold text-slate-900">
                                {l.summary}
                              </p>
                              {l.details && (
                                <p className="text-[11px] text-slate-600">
                                  {l.details}
                                </p>
                              )}
                              <p className="text-[10px] text-slate-400">
                                Oleh {l.actorName} •{" "}
                                {formatDateId(l.createdAt)}
                              </p>
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

