"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Settings01Icon,
  Package01Icon,
  CheckmarkCircle02Icon,
  DeliveryTruck01Icon,
  Copy01Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function MarketplaceDocsPage() {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["marketplace-manifest"],
    queryFn: async () => {
      const res = await fetch("/api/b2b/marketplace");
      if (!res.ok) throw new Error("Gagal mengambil data manifest B2B");
      return res.json();
    },
  });

  const manifest = data?.manifest;

  // Simulasi Injeksi Webhook Order dari Shopee
  const injectMutation = useMutation({
    mutationFn: async () => {
      const sampleOrders = [
        {
          recipientName: "Agus Pratama",
          recipientPhone: "081298765432",
          destinationAddress: "Jl. Margonda Raya No. 100",
          city: "Depok",
          province: "Jawa Barat",
          postalCode: "16424",
          weightGram: 1200,
          courier: "JNT",
          notes: "Shopee Reguler - Harum Keripik Kang Budi",
        },
        {
          recipientName: "Dewi Melati",
          recipientPhone: "081344445555",
          destinationAddress: "Perum Permata Blok B No. 4",
          city: "Jakarta Barat",
          province: "DKI Jakarta",
          postalCode: "11530",
          weightGram: 800,
          courier: "JNT",
          notes: "Shopee COD - Hijab Sinta Store",
        },
        {
          recipientName: "Farhan Hakim",
          recipientPhone: "085711223344",
          destinationAddress: "Gg. Kancil No. 12",
          city: "Tangerang Selatan",
          province: "Banten",
          postalCode: "15412",
          weightGram: 1500,
          courier: "JNT",
          notes: "Shopee Instant - Casing HP Fajar Gadget",
        },
      ];

      const res = await fetch("/api/b2b/marketplace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clusterCode: "GRIYA01",
          orders: sampleOrders,
        }),
      });

      if (!res.ok) throw new Error("Gagal simulasi order");
      return res.json();
    },
    onSuccess: (res) => {
      setSimulationResult(JSON.stringify(res, null, 2));
      queryClient.invalidateQueries({ queryKey: ["marketplace-manifest"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const sampleJsonSnippet = `POST /api/b2b/marketplace
Content-Type: application/json
Authorization: Bearer spx-live-secret-consolio-2026

{
  "clusterCode": "GRIYA01",
  "pickupDate": "2026-10-31",
  "orders": [
    {
      "sellerEmail": "budi@umkm.id",
      "recipientName": "Agus Pratama",
      "recipientPhone": "081298765432",
      "destinationAddress": "Jl. Margonda Raya No. 100",
      "city": "Depok",
      "province": "Jawa Barat",
      "postalCode": "16424",
      "weightGram": 1200,
      "courier": "JNT",
      "notes": "Shopee Order #261031SPX001"
    }
  ]
}`;

  return (
    <AppShell
      breadcrumbs={[
        { label: "B2B Integration", href: "/marketplace/docs" },
        { label: "Marketplace Hub & API Documentation" },
      ]}
    >
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <HugeiconsIcon icon={Settings01Icon} size={22} className="text-teal-700" />
              Marketplace Hub & Webhook Integration
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Hubungkan sistem logistik E-Commerce (Shopee / Tokopedia) langsung ke Cluster fisik Consolio.
            </p>
          </div>
          <Badge variant="teal" className="text-xs font-bold self-start">
            B2B2C Multi-Tenant API
          </Badge>
        </div>

        {/* Ringkasan Integrasi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-200">
                <HugeiconsIcon icon={Package01Icon} size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Paket Antrean Manifest</p>
                <p className="text-xl font-black text-slate-900">
                  {manifest?.totalPackages || 0} Paket
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200">
                <HugeiconsIcon icon={DeliveryTruck01Icon} size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Berat Antrean</p>
                <p className="text-xl font-black text-blue-950">
                  {manifest?.totalWeightKg || "0"} kg
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-slate-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Cluster Titik Kumpul</p>
                <p className="text-base font-extrabold text-slate-800">
                  {manifest?.targetCluster?.name || "Komplek Griya Asri"}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sandbox Simulator */}
        <Card className="rounded-2xl border-teal-200 bg-teal-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <HugeiconsIcon icon={PlayIcon} size={18} className="text-teal-700" />
                  Simulasi Webhook Injeksi Pesanan Shopee
                </CardTitle>
                <CardDescription>
                  Klik tombol di samping untuk menyuntikkan 3 pesanan marketplace sekaligus ke Cluster Griya Asri.
                </CardDescription>
              </div>
              <Button
                onClick={() => injectMutation.mutate()}
                disabled={injectMutation.isPending}
                className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-xl"
              >
                {injectMutation.isPending ? "Mengirim Payload..." : "Kirim Webhook Order 🚀"}
              </Button>
            </div>
          </CardHeader>
          {simulationResult && (
            <CardContent className="pt-0">
              <div className="bg-slate-900 text-teal-300 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-40">
                <pre>{simulationResult}</pre>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Live Manifest Kurir Marketplace */}
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">
                Pickup Manifest Kurir Marketplace ({manifest?.manifestId || "MNF-SPX-LIVE"})
              </CardTitle>
              <CardDescription>
                Daftar paket yang siap diambil oleh kurir marketplace dari titik kumpul cluster.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-bold rounded-xl"
            >
              Cetak Manifest 🖨️
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 text-center text-xs text-slate-400">Memuat manifest...</div>
            ) : manifest?.items?.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada paket yang siap pickup di manifest saat ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {manifest?.items?.slice(0, 8).map((it: {
                  draftId: string;
                  sellerName: string;
                  storeName: string;
                  recipientName: string;
                  destination: string;
                  weightGram: number;
                  courier: string;
                  status: string;
                }) => (
                  <div key={it.draftId} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">
                        {it.storeName} ({it.sellerName})
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        Penerima: {it.recipientName} • Tujuan: {it.destination}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-semibold text-teal-800">
                        {(it.weightGram / 1000).toFixed(1)} kg • {it.courier}
                      </span>
                      <span className="block text-[10px] text-slate-400">{it.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* API Docs & Code Snippet */}
        <Card className="rounded-2xl border-slate-200">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Dokumentasi API Webhook B2B</CardTitle>
              <CardDescription>
                Spesifikasi request untuk integrasi webhook backend Marketplace ke Consolio.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(sampleJsonSnippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="text-xs font-semibold gap-1 rounded-xl"
            >
              <HugeiconsIcon icon={Copy01Icon} size={14} />
              {copied ? "Tersalin!" : "Salin JSON"}
            </Button>
          </CardHeader>
          <CardContent className="p-4">
            <div className="bg-slate-950 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto">
              <pre>{sampleJsonSnippet}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
