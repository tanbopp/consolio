"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Share2,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { GroupPickupStatusBadge, DraftStatusBadge } from "@/components/ui/badge";
import { COURIER_LABELS, PICKUP_WINDOW_LABELS } from "@/lib/constants";
import { formatRupiah, formatWeight, formatDateId, cn } from "@/lib/utils";

export default function PickupDetailPage() {
  const params = useParams();
  const pickupId = String(params?.id || "");
  const { data: session } = useSession();
  const queryClient = useQueryClient();

  const [copied, setCopied] = useState(false);
  const [calculationOpen, setCalculationOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"packages" | "logs">("packages");
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
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const pickup = data?.pickup;
  const logs = data?.logs || [];

  // Ekspor CSV rincian biaya dari halaman detail
  const handleExportCsv = () => {
    if (!pickup) return;
    const headers = [
      "Penjual",
      "Toko",
      "Jumlah Paket",
      "Berat (Gram)",
      "Porsi Berat (%)",
      "Biaya Pickup Dasar (Rp)",
      "Fee Platform (Rp)",
      "Total Tagihan (Rp)",
      "Status Bayar",
    ];

    const rows = pickup.payments.map((p: {
      sellerName: string;
      storeName: string;
      packageCount: number;
      totalWeightGram: number;
      weightPercent: number;
      costShare: number;
      platformFee: number;
      amount: number;
      status: string;
    }) => [
      `"${p.sellerName}"`,
      `"${p.storeName}"`,
      p.packageCount,
      p.totalWeightGram,
      p.weightPercent,
      p.costShare,
      p.platformFee,
      p.amount,
      p.status,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r: (string | number)[]) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pickup-${pickup.code}-rincian-biaya.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="space-y-5">
        {/* A. Breadcrumb & Page Header */}
        <div className="space-y-1.5">
          <nav className="text-xs text-[#626E76] flex items-center gap-1.5">
            <Link href="/history" className="hover:text-[#182126] hover:underline">
              Riwayat
            </Link>
            <span>/</span>
            <span className="text-[#182126] font-medium">Detail pickup</span>
          </nav>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
                  Pickup {pickup?.code || pickupId}
                </h1>
                {pickup && <GroupPickupStatusBadge status={pickup.status} />}
              </div>
              {pickup && (
                <p className="text-xs text-[#626E76]">
                  {pickup.clusterName} ({pickup.clusterCode}) •{" "}
                  {COURIER_LABELS[pickup.courier] || pickup.courier} •{" "}
                  {formatDateId(pickup.pickupDate, true)}, Pukul {pickup.pickupTime} WIB (
                  {PICKUP_WINDOW_LABELS[pickup.pickupWindow]?.label})
                </p>
              )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyShareLink}
                className="gap-1.5 text-xs h-8"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#20734D]" />
                    <span>Link tersalin</span>
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5 text-[#626E76]" />
                    <span>Bagikan</span>
                  </>
                )}
              </Button>
              {pickup && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleExportCsv}
                  className="gap-1.5 text-xs h-8"
                >
                  <Download className="h-3.5 w-3.5 text-[#626E76]" />
                  <span>Ekspor</span>
                </Button>
              )}

              {/* Action Admin Operasional */}
              {isAdminRole && pickup && pickup.status !== "COMPLETED" && pickup.status !== "CANCELLED" && (
                <Button
                  size="sm"
                  variant="default"
                  disabled={actionMutation.isPending}
                  onClick={() =>
                    actionMutation.mutate({ action: "COMPLETE_PICKUP" })
                  }
                  className="h-8 text-xs font-semibold"
                >
                  Konfirmasi Selesai
                </Button>
              )}
            </div>
          </div>
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

        {isLoading ? (
          <div className="h-64 rounded border border-[#E3E7EA] bg-white animate-pulse" />
        ) : error || !pickup ? (
          <div className="rounded border border-[#E3E7EA] bg-white p-8 text-center space-y-2">
            <p className="text-sm font-semibold text-[#182126]">
              Data pickup tidak ditemukan
            </p>
            <p className="text-xs text-[#626E76]">
              Kode pickup tidak terdaftar atau telah dihapus.
            </p>
          </div>
        ) : (
          <>
            {/* B. Operational Summary Strip (Single Baris dengan Divider Vertikal) */}
            <div className="rounded border border-[#E3E7EA] bg-white p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 divide-y md:divide-y-0 md:divide-x divide-[#E3E7EA]">
                <div className="py-2 md:py-0 md:px-4 first:pl-0">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Jadwal pickup
                  </span>
                  <p className="text-sm font-semibold text-[#182126] mt-0.5 tabular-nums">
                    {formatDateId(pickup.pickupDate)} • {pickup.pickupTime} WIB
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    {PICKUP_WINDOW_LABELS[pickup.pickupWindow]?.label}
                  </span>
                </div>

                <div className="py-2 md:py-0 md:px-4">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Total paket / penjual
                  </span>
                  <p className="text-sm font-semibold text-[#182126] mt-0.5 tabular-nums">
                    {pickup.totalPackages} paket / {pickup.payments.length} penjual
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Konsolidasi pickup
                  </span>
                </div>

                <div className="py-2 md:py-0 md:px-4">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Total berat
                  </span>
                  <p className="text-sm font-semibold text-[#182126] mt-0.5 tabular-nums">
                    {formatWeight(pickup.totalWeightGram)}
                  </p>
                  <span className="text-[11px] text-[#626E76] tabular-nums">
                    {pickup.totalWeightGram.toLocaleString("id-ID")} gram
                  </span>
                </div>

                <div className="py-2 md:py-0 md:px-4">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Biaya pickup kurir
                  </span>
                  <p className="text-sm font-semibold text-[#182126] mt-0.5 tabular-nums">
                    {formatRupiah(pickup.basePickupFee)}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    Fee platform {pickup.platformFeePercent}%
                  </span>
                </div>

                <div className="py-2 md:py-0 md:px-4 last:pr-0">
                  <span className="text-[11px] font-medium text-[#626E76] block">
                    Total tagihan grup
                  </span>
                  <p className="text-sm font-bold text-[#17685F] mt-0.5 tabular-nums">
                    {formatRupiah(pickup.totalCost)}
                  </p>
                  <span className="text-[11px] text-[#626E76]">
                    {pickup.costLocked ? "Biaya terkunci" : "Estimasi terkunci"}
                  </span>
                </div>
              </div>

              {/* Titik Kumpul & Koordinator Satu Baris Metadata di Bawah */}
              <div className="mt-3.5 pt-3 border-t border-[#E3E7EA] flex flex-wrap items-center justify-between gap-2 text-xs text-[#626E76]">
                <div className="flex items-center gap-1.5">
                  <span>Titik kumpul:</span>
                  <strong className="text-[#182126] font-medium">{pickup.centerAddress}</strong>
                  <span>• Koordinator:</span>
                  <strong className="text-[#182126] font-medium">{pickup.adminName}</strong>
                </div>
                {pickup.roundingDiff !== 0 && (
                  <span className="text-[11px] tabular-nums">
                    Selisih pembulatan: {formatRupiah(pickup.roundingDiff)}
                  </span>
                )}
              </div>
            </div>

            {/* C. Rincian Biaya Menjadi Fokus Utama */}
            <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
              <div className="p-4 border-b border-[#E3E7EA] flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAFAFA]">
                <div>
                  <h2 className="text-sm font-semibold text-[#182126]">
                    Pembagian biaya
                  </h2>
                  <p className="text-xs text-[#626E76] mt-0.5">
                    Biaya dibagi berdasarkan berat paket.{" "}
                    {pickup.costLocked && (
                      <span className="text-[#20734D] font-medium">
                        Biaya dikunci setelah pickup selesai.
                      </span>
                    )}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setCalculationOpen(!calculationOpen)}
                  className="inline-flex items-center gap-1 text-xs text-[#17685F] hover:underline self-start sm:self-auto font-medium"
                >
                  <Info className="h-3.5 w-3.5" />
                  <span>{calculationOpen ? "Tutup perhitungan" : "Lihat perhitungan"}</span>
                  {calculationOpen ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Disclosure Perhitungan */}
              {calculationOpen && (
                <div className="p-4 bg-[#F8FAFA] border-b border-[#E3E7EA] text-xs text-[#182126] space-y-2">
                  <p className="font-semibold text-xs">Rumus Operasional:</p>
                  <p className="font-mono text-[11px] text-[#10534C] bg-white p-2 rounded border border-[#E3E7EA]">
                    biaya_penjual = (berat_penjual / total_berat) × biaya_pickup × (1 + fee_platform)
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-[#626E76] text-[11px]">
                    <li>Basis total berat pickup: <strong>{formatWeight(pickup.totalWeightGram)}</strong></li>
                    <li>Biaya pickup kurir dasar: <strong>{formatRupiah(pickup.basePickupFee)}</strong></li>
                    <li>Fee platform: <strong>{pickup.platformFeePercent}%</strong> ({formatRupiah(Math.round(pickup.basePickupFee * (pickup.platformFeePercent / 100)))})</li>
                    <li>Pembulatan nominal tagihan ke Rupiah terdekat, dengan jaminan total tidak melebihi plafon pickup.</li>
                  </ul>
                </div>
              )}

              {/* Tabel Desktop Pembagian Biaya */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#F6F7F8] text-[#626E76] font-semibold border-b border-[#E3E7EA]">
                    <tr>
                      <th className="py-3 px-4">Penjual / Toko</th>
                      <th className="py-3 px-3 text-right">Paket</th>
                      <th className="py-3 px-3 text-right">Berat</th>
                      <th className="py-3 px-3 text-right">Porsi berat</th>
                      <th className="py-3 px-3 text-right">Biaya pickup</th>
                      <th className="py-3 px-3 text-right">Fee</th>
                      <th className="py-3 px-3 text-right font-bold text-[#182126]">Total</th>
                      <th className="py-3 px-4 text-center">Status bayar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E3E7EA]">
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
                        status: string;
                      }) => {
                        const isMe = pay.sellerId === user?.id;
                        return (
                          <tr
                            key={pay.id}
                            className={cn(
                              "transition-colors h-14",
                              isMe ? "bg-[#F4F9F8]" : "hover:bg-[#FAFAFA]"
                            )}
                          >
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#182126]">
                                  {pay.sellerName}
                                </span>
                                {isMe && (
                                  <span className="rounded bg-[#E3E7EA] px-1.5 py-0.2 text-[10px] font-medium text-[#182126]">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#626E76] block mt-0.5">
                                {pay.storeName}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums text-[#182126]">
                              {pay.packageCount}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums text-[#182126]">
                              {formatWeight(pay.totalWeightGram)}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums text-[#626E76]">
                              {pay.weightPercent}%
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums text-[#626E76]">
                              {formatRupiah(pay.costShare)}
                            </td>
                            <td className="py-3 px-3 text-right tabular-nums text-[#626E76]">
                              {formatRupiah(pay.platformFee)}
                            </td>
                            <td className="py-3 px-3 text-right font-semibold text-[#182126] tabular-nums">
                              {formatRupiah(pay.amount)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              {pay.status === "PAID" ? (
                                <span className="inline-flex items-center gap-1.5 text-xs text-[#20734D] font-medium">
                                  <span className="h-1.5 w-1.5 rounded-full bg-[#20734D]" />
                                  Lunas
                                </span>
                              ) : (
                                <div className="inline-flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 text-xs text-[#9A6700] font-medium">
                                    <span className="h-1.5 w-1.5 rounded-full bg-[#9A6700]" />
                                    Belum bayar
                                  </span>
                                  {(isMe || isAdminRole) && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        actionMutation.mutate({
                                          action: "MARK_PAYMENT_PAID",
                                          paymentId: pay.id,
                                        })
                                      }
                                      className="rounded border border-[#E3E7EA] bg-white px-2 py-0.5 text-[11px] font-medium text-[#182126] hover:bg-[#F6F7F8]"
                                    >
                                      Tandai lunas
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      }
                    )}
                  </tbody>
                  {/* Footer Total yang Cocok dengan Transaksi */}
                  <tfoot className="border-t-2 border-[#E3E7EA] bg-[#F6F7F8] font-semibold text-[#182126]">
                    <tr>
                      <td className="py-3 px-4">Total</td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {pickup.totalPackages}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {formatWeight(pickup.totalWeightGram)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">100%</td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {formatRupiah(
                          pickup.payments.reduce(
                            (s: number, p: { costShare: number }) => s + p.costShare,
                            0
                          )
                        )}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        {formatRupiah(
                          pickup.payments.reduce(
                            (s: number, p: { platformFee: number }) => s + p.platformFee,
                            0
                          )
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#17685F] tabular-nums">
                        {formatRupiah(pickup.totalCost)}
                      </td>
                      <td className="py-3 px-4" />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* D. Paket & Aktivitas (Tabs Sederhana) */}
            <div className="rounded border border-[#E3E7EA] bg-white">
              <div className="border-b border-[#E3E7EA] px-4 flex items-center gap-6">
                <button
                  type="button"
                  onClick={() => setActiveTab("packages")}
                  className={cn(
                    "py-3 text-xs font-semibold border-b-2 -mb-px transition-colors",
                    activeTab === "packages"
                      ? "border-[#17685F] text-[#17685F]"
                      : "border-transparent text-[#626E76] hover:text-[#182126]"
                  )}
                >
                  Daftar paket ({pickup.items.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("logs")}
                  className={cn(
                    "py-3 text-xs font-semibold border-b-2 -mb-px transition-colors",
                    activeTab === "logs"
                      ? "border-[#17685F] text-[#17685F]"
                      : "border-transparent text-[#626E76] hover:text-[#182126]"
                  )}
                >
                  Aktivitas ({logs.length})
                </button>
              </div>

              {activeTab === "packages" && (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F6F7F8] text-[#626E76] font-semibold border-b border-[#E3E7EA]">
                      <tr>
                        <th className="py-2.5 px-4">Pengirim</th>
                        <th className="py-2.5 px-4">Penerima & Alamat</th>
                        <th className="py-2.5 px-4 text-right">Berat</th>
                        <th className="py-2.5 px-4 text-right">Alokasi biaya</th>
                        <th className="py-2.5 px-4 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E3E7EA]">
                      {pickup.items.map(
                        (item: {
                          id: string;
                          sellerName: string;
                          storeName: string;
                          recipientName: string;
                          destinationAddress: string;
                          city: string;
                          province: string;
                          weightGram: number;
                          totalCharge: number;
                          draftStatus: string;
                        }) => (
                          <tr key={item.id} className="hover:bg-[#FAFAFA]">
                            <td className="py-2.5 px-4">
                              <span className="font-semibold text-[#182126] block">
                                {item.storeName}
                              </span>
                              <span className="text-[11px] text-[#626E76]">
                                {item.sellerName}
                              </span>
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="font-medium text-[#182126] block">
                                {item.recipientName}
                              </span>
                              <span className="text-[11px] text-[#626E76]">
                                {item.city}, {item.province}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right tabular-nums text-[#182126]">
                              {formatWeight(item.weightGram)}
                            </td>
                            <td className="py-2.5 px-4 text-right font-medium tabular-nums text-[#182126]">
                              {formatRupiah(item.totalCharge)}
                            </td>
                            <td className="py-2.5 px-4 text-center">
                              <DraftStatusBadge status={item.draftStatus} />
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === "logs" && (
                <div className="p-4">
                  {logs.length === 0 ? (
                    <p className="text-xs text-[#8D98A0] text-center py-4">
                      Tidak ada catatan aktivitas untuk pickup ini.
                    </p>
                  ) : (
                    <div className="space-y-2 text-xs">
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
                            className="rounded border border-[#E3E7EA] p-3 space-y-1 bg-[#FAFAFA]"
                          >
                            <p className="font-medium text-[#182126]">
                              {l.summary}
                            </p>
                            {l.details && (
                              <p className="text-[11px] text-[#626E76]">
                                {l.details}
                              </p>
                            )}
                            <p className="text-[11px] text-[#8D98A0]">
                              Oleh {l.actorName} • {formatDateId(l.createdAt)}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
