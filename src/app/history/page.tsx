"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  ExternalLink,
  Share2,
  Check,
  Filter,
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge, GroupPickupStatusBadge } from "@/components/ui/badge";
import {
  COURIER_LABELS,
  PICKUP_WINDOW_LABELS,
  GROUP_PICKUP_STATUS_CONFIG,
} from "@/lib/constants";
import { formatRupiah, formatWeight, formatDateId } from "@/lib/utils";

export default function HistoryAndReportsPage() {
  const [clusterId, setClusterId] = useState("");
  const [courier, setCourier] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { data: clustersData } = useQuery({
    queryKey: ["clusters", "list-filter"],
    queryFn: async () => {
      const res = await fetch("/api/clusters");
      if (!res.ok) return { clusters: [] };
      return res.json();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ["pickups", clusterId, courier, status, dateFrom, dateTo],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (clusterId) params.set("clusterId", clusterId);
      if (courier) params.set("courier", courier);
      if (status) params.set("status", status);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/pickups?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal memuat riwayat pickup");
      return res.json();
    },
  });

  const pickups = data?.pickups || [];
  const clusters = clustersData?.clusters || [];

  // Fungsi Ekspor CSV Riwayat Pickup & Rincian Biaya Per Penjual (4.9)
  const handleExportCsv = () => {
    const headers = [
      "Kode Pickup",
      "Tanggal Pickup",
      "Jam Pickup",
      "Jendela Waktu",
      "Cluster",
      "Kurir",
      "Status Pickup",
      "Nama Penjual",
      "Nama Toko",
      "Jumlah Paket Penjual",
      "Berat Penjual (Gram)",
      "Persentase Berat (%)",
      "Biaya Sebelum Fee (Rp)",
      "Fee Platform (Rp)",
      "Total Tagihan Penjual (Rp)",
      "Estimasi Penghematan (Rp)",
      "Status Pembayaran",
    ];

    const rows: string[][] = [];

    pickups.forEach(
      (gp: {
        code: string;
        pickupDate: string;
        pickupTime: string;
        pickupWindow: string;
        clusterName: string;
        courier: string;
        status: string;
        payments: Array<{
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
        }>;
      }) => {
        gp.payments.forEach((pay) => {
          rows.push([
            gp.code,
            gp.pickupDate,
            gp.pickupTime || "-",
            PICKUP_WINDOW_LABELS[gp.pickupWindow]?.label || gp.pickupWindow,
            `"${gp.clusterName}"`,
            COURIER_LABELS[gp.courier] || gp.courier,
            gp.status,
            `"${pay.sellerName}"`,
            `"${pay.storeName}"`,
            String(pay.packageCount),
            String(pay.totalWeightGram),
            String(pay.weightPercent),
            String(pay.costShare),
            String(pay.platformFee),
            String(pay.amount),
            String(pay.estimatedSavings),
            pay.status,
          ]);
        });
      }
    );

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `consolio-riwayat-pickup-dan-biaya-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyShareUrl = (id: string) => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/pickups/${id}`;
      navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900">
              Riwayat Pengiriman & Laporan Biaya
            </h1>
            <p className="text-sm text-slate-600">
              Filter berdasarkan tanggal, cluster, kurir, dan status. Unduh
              laporan lengkap dalam format CSV atau bagikan link detail pickup.
            </p>
          </div>
          <Button
            type="button"
            variant="cta"
            onClick={handleExportCsv}
            disabled={pickups.length === 0}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV Riwayat & Biaya</span>
          </Button>
        </div>

        {/* Filter Panel (4.9) */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Filter className="h-4 w-4 text-teal-700" />
              Filter Laporan Riwayat Pickup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs">Dari Tanggal</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Sampai Tanggal</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Cluster</Label>
                <select
                  value={clusterId}
                  onChange={(e) => setClusterId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
                >
                  <option value="">Semua Cluster</option>
                  {clusters.map(
                    (c: { id: string; name: string; code: string }) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    )
                  )}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Kurir</Label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
                >
                  <option value="">Semua Kurir</option>
                  {Object.entries(COURIER_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Status Pickup</Label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium"
                >
                  <option value="">Semua Status</option>
                  {Object.entries(GROUP_PICKUP_STATUS_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daftar Riwayat Pickup Bersama */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-slate-200/70 animate-pulse"
              />
            ))}
          </div>
        ) : pickups.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-2">
              <History className="h-8 w-8 text-slate-400 mx-auto" />
              <p className="text-sm font-bold text-slate-800">
                Tidak Ada Riwayat Pickup yang Sesuai Filter
              </p>
              <p className="text-xs text-slate-500">
                Coba ubah rentang tanggal atau reset filter pencarian di atas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {pickups.map(
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
                basePickupFee: number;
                platformFeePercent: number;
                totalCost: number;
                status: string;
                payments: Array<{
                  id: string;
                  sellerName: string;
                  storeName: string;
                  packageCount: number;
                  totalWeightGram: number;
                  weightPercent: number;
                  amount: number;
                }>;
              }) => (
                <Card key={gp.id} className="hover:border-teal-300">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Link
                            href={`/pickups/${gp.id}`}
                            className="font-mono text-sm font-extrabold text-teal-900 bg-teal-50 px-2.5 py-0.5 rounded border border-teal-200 hover:underline"
                          >
                            {gp.code}
                          </Link>
                          <GroupPickupStatusBadge status={gp.status} />
                          <Badge variant="teal">
                            {COURIER_LABELS[gp.courier]}
                          </Badge>
                          <span className="text-xs text-slate-500">
                            {formatDateId(gp.pickupDate, true)} • Pukul{" "}
                            {gp.pickupTime} WIB (
                            {PICKUP_WINDOW_LABELS[gp.pickupWindow]?.label})
                          </span>
                        </div>
                        <CardTitle className="text-base pt-1">
                          {gp.clusterName} ({gp.clusterCode}) —{" "}
                          {gp.totalPackages} Paket (
                          {formatWeight(gp.totalWeightGram)})
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Biaya Pickup Dasar: {formatRupiah(gp.basePickupFee)} +
                          Fee Platform {gp.platformFeePercent}% = Total{" "}
                          <strong className="text-slate-900">
                            {formatRupiah(gp.totalCost)}
                          </strong>
                        </CardDescription>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => copyShareUrl(gp.id)}
                          className="gap-1.5 text-xs"
                        >
                          {copiedId === gp.id ? (
                            <>
                              <Check className="h-3.5 w-3.5 text-emerald-600" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Share2 className="h-3.5 w-3.5" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </Button>
                        <Link href={`/pickups/${gp.id}`}>
                          <Button size="sm" className="gap-1.5 text-xs">
                            <span>Detail Lengkap</span>
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                      {gp.payments.map((p) => (
                        <div
                          key={p.id}
                          className="rounded-lg bg-slate-50 p-2.5 border border-slate-200/80 flex items-center justify-between"
                        >
                          <div>
                            <p className="font-bold text-slate-900 truncate">
                              {p.sellerName}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {p.packageCount} pkt •{" "}
                              {formatWeight(p.totalWeightGram)} (
                              {p.weightPercent}%)
                            </p>
                          </div>
                          <span className="font-extrabold text-teal-900">
                            {formatRupiah(p.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}

