"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Download,
  Share2,
  Check,
  History,
  ExternalLink,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GroupPickupStatusBadge } from "@/components/ui/badge";
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
      "Jumlah Paket",
      "Berat (Gram)",
      "Porsi Berat (%)",
      "Biaya Sebelum Fee (Rp)",
      "Fee Platform (Rp)",
      "Total Tagihan (Rp)",
      "Status Pembayaran",
    ];

    const rows: string[][] = [];

    pickups.forEach((gp: {
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
          pay.status,
        ]);
      });
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `consolio-riwayat-pickup-${new Date().toISOString().slice(0, 10)}.csv`
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
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#182126]">
              Riwayat & Laporan Pickup
            </h1>
            <p className="text-xs text-[#626E76] mt-0.5">
              Data seluruh jadwal pickup bersama yang telah dibuat atau diselesaikan.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={pickups.length === 0}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV</span>
          </Button>
        </div>

        {/* Filter Strip Ringkas */}
        <div className="rounded border border-[#E3E7EA] bg-white p-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 items-end text-xs">
            <div>
              <span className="text-[11px] font-medium text-[#626E76] block mb-1">Dari tanggal</span>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#626E76] block mb-1">Sampai tanggal</span>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#626E76] block mb-1">Cluster</span>
              <select
                value={clusterId}
                onChange={(e) => setClusterId(e.target.value)}
                className="h-8 w-full rounded border border-[#E3E7EA] bg-white px-2 py-1 text-xs text-[#182126]"
              >
                <option value="">Semua cluster</option>
                {clusters.map((c: { id: string; name: string; code: string }) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#626E76] block mb-1">Kurir</span>
              <select
                value={courier}
                onChange={(e) => setCourier(e.target.value)}
                className="h-8 w-full rounded border border-[#E3E7EA] bg-white px-2 py-1 text-xs text-[#182126]"
              >
                <option value="">Semua kurir</option>
                {Object.entries(COURIER_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className="text-[11px] font-medium text-[#626E76] block mb-1">Status</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="h-8 w-full rounded border border-[#E3E7EA] bg-white px-2 py-1 text-xs text-[#182126]"
              >
                <option value="">Semua status</option>
                {Object.entries(GROUP_PICKUP_STATUS_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Pickup */}
        <div className="rounded border border-[#E3E7EA] bg-white overflow-hidden">
          {isLoading ? (
            <div className="h-48 animate-pulse bg-white p-4" />
          ) : pickups.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <History className="h-6 w-6 text-[#8D98A0] mx-auto" />
              <p className="text-xs font-semibold text-[#182126]">
                Tidak ada data riwayat pickup
              </p>
              <p className="text-xs text-[#626E76]">
                Coba sesuaikan rentang tanggal atau filter di atas.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#F6F7F8] text-[#626E76] font-semibold border-b border-[#E3E7EA]">
                  <tr>
                    <th className="py-2.5 px-4">Kode pickup</th>
                    <th className="py-2.5 px-3">Cluster</th>
                    <th className="py-2.5 px-3">Kurir</th>
                    <th className="py-2.5 px-3">Tanggal & jam</th>
                    <th className="py-2.5 px-3 text-right">Paket</th>
                    <th className="py-2.5 px-3 text-right">Total berat</th>
                    <th className="py-2.5 px-3 text-right">Total tagihan</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E3E7EA]">
                  {pickups.map((gp: {
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
                    <tr key={gp.id} className="hover:bg-[#FAFAFA] transition-colors h-14">
                      <td className="py-2.5 px-4">
                        <Link
                          href={`/pickups/${gp.id}`}
                          className="font-semibold text-[#17685F] hover:underline"
                        >
                          {gp.code}
                        </Link>
                      </td>
                      <td className="py-2.5 px-3 font-medium text-[#182126]">
                        {gp.clusterName} ({gp.clusterCode})
                      </td>
                      <td className="py-2.5 px-3 text-[#182126]">
                        {COURIER_LABELS[gp.courier] || gp.courier}
                      </td>
                      <td className="py-2.5 px-3 text-[#182126]">
                        <span className="block font-medium">{formatDateId(gp.pickupDate)}</span>
                        <span className="text-[11px] text-[#626E76]">{gp.pickupTime} WIB</span>
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[#182126]">
                        {gp.totalPackages}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums text-[#182126]">
                        {formatWeight(gp.totalWeightGram)}
                      </td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold text-[#182126]">
                        {formatRupiah(gp.totalCost)}
                      </td>
                      <td className="py-2.5 px-3">
                        <GroupPickupStatusBadge status={gp.status} />
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => copyShareUrl(gp.id)}
                            className="rounded border border-[#E3E7EA] bg-white p-1.5 text-[#626E76] hover:bg-[#F6F7F8] hover:text-[#182126]"
                            title="Salin link pickup"
                          >
                            {copiedId === gp.id ? (
                              <Check className="h-3.5 w-3.5 text-[#20734D]" />
                            ) : (
                              <Share2 className="h-3.5 w-3.5" />
                            )}
                          </button>
                          <Link href={`/pickups/${gp.id}`}>
                            <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 gap-1">
                              <span>Detail</span>
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
