"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Package01Icon,
  Time01Icon,
  Location01Icon,
} from "@hugeicons/core-free-icons";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS_CONFIG } from "@/lib/constants";
import { formatDateId } from "@/lib/utils";

interface OrderItem {
  id: string;
  productName: string;
  qty: number;
  price: number;
  notes?: string;
}

interface Order {
  id: string;
  storeName: string;
  status: string;
  totalPrice: number;
  deliveryFee: number;
  deliveryWindow: string;
  dropoffLocation: string;
  customerNotes?: string;
  createdAt: string;
  items: OrderItem[];
}

export default function CampusOrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["campus-my-orders"],
    queryFn: async () => {
      const res = await fetch("/api/campus/orders?action=my-orders");
      if (!res.ok) throw new Error("Gagal mengambil riwayat pesanan");
      return res.json();
    },
    refetchInterval: 5000, // Real-time poll setiap 5 detik
  });

  const orders: Order[] = data?.orders || [];

  return (
    <AppShell
      breadcrumbs={[
        { label: "Consolio Kampus", href: "/campus" },
        { label: "Lacak & Riwayat Pesanan" },
      ]}
    >
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Lacak Pesanan Kampus
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pantau status makananmu dari proses persiapan kantin hingga tiba di tangan kurir.
            </p>
          </div>
          <Badge variant="teal" className="flex items-center gap-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Tracking
          </Badge>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-slate-400 text-sm">
            Memuat data pesanan...
          </div>
        ) : orders.length === 0 ? (
          <Card className="rounded-2xl border-slate-200 p-8 text-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
              <HugeiconsIcon icon={Package01Icon} size={24} />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Belum Ada Pesanan</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Kamu belum membuat pesanan kantin hari ini. Yuk pesan makanan sebelum batch jam pengantaran berikutnya!
            </p>
            <a
              href="/campus"
              className="mt-4 inline-flex items-center px-4 py-2 rounded-xl bg-teal-700 text-white text-xs font-bold hover:bg-teal-800"
            >
              Pesan Sekarang
            </a>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((ord) => {
              const statusCfg = ORDER_STATUS_CONFIG[ord.status] || {
                label: ord.status,
                badgeClass: "bg-slate-100 text-slate-800",
              };

              // Progress Step status
              const steps = [
                { key: "PENDING", label: "Menunggu" },
                { key: "PREPARING", label: "Dimasak" },
                { key: "READY", label: "Siap Ambil" },
                { key: "ON_DELIVERY", label: "Diantar Kurir" },
                { key: "COMPLETED", label: "Tiba" },
              ];

              const currentStepIdx = steps.findIndex((s) => s.key === ord.status);

              return (
                <Card key={ord.id} className="rounded-2xl border-slate-200 overflow-hidden shadow-xs">
                  <CardHeader className="bg-slate-50/60 pb-3 border-b border-slate-100">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{ord.storeName}</span>
                        <span className="text-slate-400">•</span>
                        <span className="text-xs text-slate-500">
                          {formatDateId(ord.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <HugeiconsIcon icon={Time01Icon} size={14} className="text-teal-700" />
                          Batch {ord.deliveryWindow} WIB
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${statusCfg.badgeClass}`}
                        >
                          {statusCfg.label}
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Visual Progress Bar */}
                    <div className="py-2">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-200 w-full z-0" />
                        <div
                          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-teal-600 transition-all z-0"
                          style={{
                            width: `${Math.max(0, (currentStepIdx / (steps.length - 1)) * 100)}%`,
                          }}
                        />
                        {steps.map((st, i) => {
                          const isDone = i <= currentStepIdx;
                          const isCurrent = i === currentStepIdx;
                          return (
                            <div key={st.key} className="flex flex-col items-center relative z-10">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                  isDone
                                    ? "bg-teal-700 text-white ring-2 ring-teal-100"
                                    : "bg-slate-200 text-slate-500"
                                } ${isCurrent ? "scale-110 shadow-sm" : ""}`}
                              >
                                {i + 1}
                              </div>
                              <span
                                className={`text-[10px] mt-1 font-semibold ${
                                  isDone ? "text-teal-900" : "text-slate-400"
                                }`}
                              >
                                {st.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Rincian Menu */}
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs">
                      {ord.items.map((it) => (
                        <div key={it.id} className="flex justify-between items-center text-slate-700">
                          <span>
                            {it.qty}x {it.productName}
                            {it.notes && (
                              <span className="text-[11px] text-slate-400 block italic">
                                Catatan: {it.notes}
                              </span>
                            )}
                          </span>
                          <span className="font-semibold text-slate-900">
                            Rp{(it.price * it.qty).toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Informasi Pengantaran */}
                    <div className="flex flex-wrap items-center justify-between text-xs text-slate-600 pt-2 border-t border-slate-100 gap-2">
                      <div className="flex items-center gap-1.5">
                        <HugeiconsIcon icon={Location01Icon} size={14} className="text-teal-700" />
                        <span>
                          Antar ke: <strong>{ord.dropoffLocation}</strong>
                        </span>
                      </div>
                      <div className="text-right">
                        <span>Total: </span>
                        <strong className="text-sm font-black text-teal-900">
                          Rp{(ord.totalPrice + ord.deliveryFee).toLocaleString("id-ID")}
                        </strong>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
